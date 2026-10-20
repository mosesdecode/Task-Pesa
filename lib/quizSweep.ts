import { prisma } from '@/lib/prisma';

let lastGlobalSweepTime = 0;

/**
 * Idempotent lazy finalization sweep for expired IN_PROGRESS quiz attempts.
 *
 * Runs whenever a task list or task detail is loaded, or when a task is started.
 * - Idempotent conditional update (`updateMany` where status = 'IN_PROGRESS') inside a transaction.
 * - Prevents double grading, double slot release, or duplicate notifications.
 * - Auto-graded failures are marked with `autoGraded: true`, `autoRejected: true`, `expired: true`.
 * - Atomically increments remainingSlots back to the pool.
 */
export async function sweepExpiredQuizAttempts(taskId?: string) {
  try {
    // Throttle global sweeps to at most once every 60 seconds to avoid DB connection exhaustion
    if (!taskId) {
      const nowMs = Date.now();
      if (nowMs - lastGlobalSweepTime < 60000) {
        return;
      }
      lastGlobalSweepTime = nowMs;
    }

    const now = new Date();

    const where: any = {
      status: 'IN_PROGRESS',
      task: {
        dataPayloadJson: { not: null },
      },
    };

    if (taskId) {
      where.taskId = taskId;
    }

    const inProgressList = await prisma.taskSubmission.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            durationSeconds: true,
            dataPayloadJson: true,
          },
        },
      },
      take: 100,
    });

    for (const sub of inProgressList) {
      let isQuiz = false;
      let rawPayload: any = null;
      try {
        if (sub.task.dataPayloadJson) {
          rawPayload = JSON.parse(sub.task.dataPayloadJson);
          if (rawPayload.mode === 'QUIZ' || (Array.isArray(rawPayload.questions) && rawPayload.questions.length > 0)) {
            isQuiz = true;
          }
        }
      } catch (e) {
        continue;
      }

      if (!isQuiz) continue;

      const duration = sub.task.durationSeconds || 300;
      // 15 seconds network grace period
      const deadline = new Date(sub.startedAt.getTime() + duration * 1000 + 15000);

      if (now > deadline) {
        let savedAnswers: Record<string, any> = {};
        try {
          if (sub.submissionDataJson) {
            const parsed = JSON.parse(sub.submissionDataJson);
            savedAnswers = parsed.answers || {};
          }
        } catch (e) {}

        const questions = rawPayload?.questions || [];
        let correctCount = 0;
        const results: Record<string, boolean> = {};

        questions.forEach((q: any) => {
          const userAns = savedAnswers[q.id];
          const isCorrect = userAns && q.correctAnswer && String(userAns).trim() === String(q.correctAnswer).trim();
          results[q.id] = !!isCorrect;
          if (isCorrect) correctCount++;
        });

        const totalQuestions = questions.length;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passMark = rawPayload?.passScorePercent || 80;

        // Atomic transaction: conditional update + conditional slot release + notification
        await prisma.$transaction(async (tx) => {
          const updated = await tx.taskSubmission.updateMany({
            where: { id: sub.id, status: 'IN_PROGRESS' },
            data: {
              status: 'REJECTED',
              rejectionReason: `Time limit expired. Score: ${score}% (Passing mark is ${passMark}%). Retries are not permitted.`,
              submissionDataJson: JSON.stringify({
                answers: savedAnswers,
                results,
                score,
                passed: false,
                totalQuestions,
                autoGraded: true,
                autoRejected: true,
                expired: true,
              }),
            },
          });

          if (updated.count > 0) {
            // Only release slot if this transaction actually transitioned the row from IN_PROGRESS
            await tx.task.update({
              where: { id: sub.taskId },
              data: { remainingSlots: { increment: 1 } },
            });

            await tx.notification.create({
              data: {
                userId: sub.userId,
                title: 'Quiz Time Expired ⌛',
                message: `Your time limit for "${sub.task.title}" expired. Your attempt has been closed with score ${score}%. Retries are not permitted.`,
                type: 'INFO',
              },
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Error in sweepExpiredQuizAttempts:', err);
  }
}
