import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const taskId = params.id;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account activation required. Please complete your KES 200 activation fee to unlock and submit digital tasks.' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { submissionDataJson, proofUrl, proofText } = body;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'PUBLISHED' && task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This task is not currently open for submissions.' }, { status: 400 });
    }

    let isQuiz = false;
    let quizPayload: any = null;
    let isMedia = false;
    let mediaPayload: any = null;
    if (task.dataPayloadJson) {
      try {
        const parsed = JSON.parse(task.dataPayloadJson);
        if (parsed.mode === 'QUIZ' || (Array.isArray(parsed.questions) && parsed.questions.length > 0)) {
          isQuiz = true;
          quizPayload = parsed;
        } else if (parsed.mode === 'MEDIA' || parsed.mediaType) {
          isMedia = true;
          mediaPayload = parsed;
        }
      } catch (e) {}
    }

    // Check if user already has an existing task submission record
    const existing = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const hasExistingInProgress = existing && existing.status === 'IN_PROGRESS';

    // Slots check: started tasks (and quizzes whose slots were reserved at start) are honored
    if (task.remainingSlots <= 0 && !hasExistingInProgress) {
      return NextResponse.json({ error: 'Task slot capacity reached. No slots remaining.' }, { status: 400 });
    }

    // Daily package submission limit check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySubmissionsCount = await prisma.taskSubmission.count({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart },
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
      },
    });

    let dailyLimit = 10;
    if (user.packageId) {
      const pkg = await prisma.membershipPackage.findUnique({
        where: { id: user.packageId },
        select: { taskLimitDaily: true },
      });
      if (pkg?.taskLimitDaily) dailyLimit = pkg.taskLimitDaily;
    }
    if (todaySubmissionsCount >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily task limit reached (${dailyLimit} tasks) for your account package. Upgrade your package to submit more tasks today!` },
        { status: 400 }
      );
    }

    if (existing) {
      if (existing.status === 'UNDER_REVIEW') {
        return NextResponse.json(
          { error: 'You have already submitted this task and it is currently awaiting admin quality review.' },
          { status: 400 }
        );
      }

      if (existing.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'You have already completed and received approval for this task.' },
          { status: 400 }
        );
      }

      if (isQuiz && existing.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'You have already attempted this quiz. Retries are not permitted.' },
          { status: 400 }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BRANCH A: INTERACTIVE QUIZ SUBMISSION (Server-Side Graded)
    // ─────────────────────────────────────────────────────────────
    if (isQuiz) {
      if (!existing || existing.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'No active quiz session found. Please start the quiz first.' },
          { status: 400 }
        );
      }

      const now = new Date();
      const duration = task.durationSeconds || 300;
      const deadline = new Date(existing.startedAt.getTime() + duration * 1000 + 15000); // 15s grace
      const isExpired = now > deadline;

      // Merge answers from body and existing autosaved answers
      let existingAnswers: Record<string, any> = {};
      try {
        if (existing.submissionDataJson) {
          existingAnswers = JSON.parse(existing.submissionDataJson).answers || {};
        }
      } catch (e) {}

      const submittedAnswers: Record<string, any> = {
        ...existingAnswers,
        ...(body.answers || (typeof submissionDataJson === 'object' ? submissionDataJson.answers || submissionDataJson : {})),
      };

      const questions = quizPayload.questions || [];
      let correctCount = 0;
      const results: Record<string, boolean> = {};

      questions.forEach((q: any) => {
        const userAns = submittedAnswers[q.id];
        const isCorrect = userAns && q.correctAnswer && String(userAns).trim() === String(q.correctAnswer).trim();
        results[q.id] = !!isCorrect;
        if (isCorrect) correctCount++;
      });

      const totalQuestions = questions.length;
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const passMark = quizPayload.passScorePercent || 80;
      const passed = !isExpired && score >= passMark;

      // Atomic conditional update in transaction to guard against concurrent double-submits
      const result = await prisma.$transaction(async (tx) => {
        if (passed) {
          // PASSED: Move to UNDER_REVIEW for mandatory admin approval before payout
          // (Slot was already reserved at start, so remainingSlots is NOT decremented again)
          const updated = await tx.taskSubmission.updateMany({
            where: { id: existing.id, status: 'IN_PROGRESS' },
            data: {
              status: 'UNDER_REVIEW',
              submittedAt: now,
              submissionDataJson: JSON.stringify({
                answers: submittedAnswers,
                results,
                score,
                passed: true,
                totalQuestions,
                autoGraded: true,
              }),
            },
          });

          if (updated.count === 0) {
            return { alreadyProcessed: true };
          }

          await tx.notification.create({
            data: {
              userId: user.id,
              title: 'Quiz Passed! 🎓',
              message: `Congratulations! You scored ${score}% on "${task.title}". Your submission has entered the admin review queue. KES ${task.reward.toFixed(2)} will be credited upon approval.`,
              type: 'SUCCESS',
            },
          });

          return { success: true, passed: true, score, results };
        } else {
          // FAILED or EXPIRED: Auto-mark as REJECTED and atomically release reserved slot back to the public pool
          const rejectionReason = isExpired
            ? `Time limit expired. Score: ${score}% (Passing mark is ${passMark}%). Retries are not permitted.`
            : `Quiz score: ${score}%. Pass mark is ${passMark}%. Retries are not permitted.`;

          const updated = await tx.taskSubmission.updateMany({
            where: { id: existing.id, status: 'IN_PROGRESS' },
            data: {
              status: 'REJECTED',
              rejectionReason,
              submittedAt: now,
              submissionDataJson: JSON.stringify({
                answers: submittedAnswers,
                results,
                score,
                passed: false,
                totalQuestions,
                autoGraded: true,
                autoRejected: true,
                expired: isExpired,
              }),
            },
          });

          if (updated.count === 0) {
            return { alreadyProcessed: true };
          }

          // Release slot back
          await tx.task.update({
            where: { id: taskId },
            data: { remainingSlots: { increment: 1 } },
          });

          await tx.notification.create({
            data: {
              userId: user.id,
              title: isExpired ? 'Quiz Time Expired ⌛' : 'Quiz Result 📋',
              message: isExpired
                ? `Your time limit for "${task.title}" expired. Score: ${score}%. This quiz cannot be retaken.`
                : `You scored ${score}% on "${task.title}". The passing mark is ${passMark}%. This quiz cannot be retaken.`,
              type: 'INFO',
            },
          });

          return { success: true, passed: false, score, results, rejectionReason };
        }
      });

      if (result.alreadyProcessed) {
        return NextResponse.json({
          success: true,
          message: 'Quiz attempt has already been submitted and processed.',
        });
      }

      if (result.passed) {
        return NextResponse.json({
          success: true,
          passed: true,
          score: result.score,
          results: result.results,
          message: `Congratulations! You scored ${result.score}% (Pass mark: ${passMark}%). Your submission is now awaiting admin review.`,
        });
      } else {
        return NextResponse.json({
          success: true,
          passed: false,
          score: result.score,
          results: result.results,
          message: result.rejectionReason,
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BRANCH B: MEDIA TASK SUBMISSION (Video Watching / Photo Review)
    // ─────────────────────────────────────────────────────────────
    if (isMedia) {
      if (!existing || existing.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'No active task session found. Please start the task first.' },
          { status: 400 }
        );
      }

      const minWatchSeconds = parseInt(mediaPayload?.minWatchSeconds) || 0;
      if (minWatchSeconds > 0 && mediaPayload?.mediaType === 'VIDEO') {
        const startedAtTs = new Date(existing.startedAt).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startedAtTs) / 1000);
        // Anti-cheat: Ensure minimum watch duration elapsed from server startedAt (3s buffer for network lag)
        if (elapsedSeconds < Math.max(0, minWatchSeconds - 4)) {
          return NextResponse.json(
            { error: `You must watch the video for at least ${minWatchSeconds} seconds before submitting. (Current elapsed: ${elapsedSeconds}s)` },
            { status: 400 }
          );
        }
      }

      // Validate comprehension question if configured
      if (mediaPayload?.comprehension?.correctAnswer) {
        const submittedAnswer = body.comprehensionAnswer || (typeof submissionDataJson === 'object' ? submissionDataJson.comprehensionAnswer : null);
        const expected = String(mediaPayload.comprehension.correctAnswer).trim().toLowerCase();
        const actual = String(submittedAnswer || '').trim().toLowerCase();
        if (!actual || actual !== expected) {
          return NextResponse.json(
            { error: 'Incorrect answer to comprehension check. Please review the media and select the correct answer.' },
            { status: 400 }
          );
        }
      }

      const mediaSubmissionData = {
        mode: 'MEDIA',
        mediaType: mediaPayload?.mediaType || 'VIDEO',
        mediaUrl: mediaPayload?.mediaUrl || task.externalUrl,
        watchTimeSeconds: body.watchTimeSeconds || minWatchSeconds,
        targetWatchSeconds: minWatchSeconds,
        comprehensionAnswer: body.comprehensionAnswer || null,
        verified: true,
        submittedAt: new Date().toISOString(),
      };

      const submission = await prisma.taskSubmission.update({
        where: { id: existing.id },
        data: {
          status: 'UNDER_REVIEW',
          proofUrl: proofUrl || existing.proofUrl,
          proofText: proofText || existing.proofText,
          submissionDataJson: JSON.stringify(mediaSubmissionData),
          submittedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Media Task Submitted! 🎬',
          message: `Your submission for "${task.title}" has been received and is now in the admin review queue. KES ${task.reward.toFixed(2)} will credit upon approval.`,
          type: 'SUCCESS',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task submitted successfully! Awaiting admin quality review.',
        submission,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // BRANCH C: STANDARD TASKS SUBMISSION
    // ─────────────────────────────────────────────────────────────
    let submission;

    if (existing) {
      submission = await prisma.taskSubmission.update({
        where: { id: existing.id },
        data: {
          status: 'UNDER_REVIEW',
          proofUrl: proofUrl || existing.proofUrl,
          proofText: proofText || existing.proofText,
          submissionDataJson: typeof submissionDataJson === 'object' ? JSON.stringify(submissionDataJson) : submissionDataJson || existing.submissionDataJson,
          submittedAt: new Date(),
        },
      });
    } else {
      submission = await prisma.taskSubmission.create({
        data: {
          taskId,
          userId: user.id,
          status: 'UNDER_REVIEW',
          proofUrl: proofUrl || null,
          proofText: proofText || null,
          submissionDataJson: typeof submissionDataJson === 'object' ? JSON.stringify(submissionDataJson) : submissionDataJson || null,
          startedAt: new Date(),
          submittedAt: new Date(),
        },
      });
    }

    // Decrement remaining slots safely for standard tasks
    if (task.remainingSlots > 0) {
      await prisma.task.update({
        where: { id: taskId },
        data: { remainingSlots: { decrement: 1 } },
      });
    }

    // Create user notification (NEVER auto-credit wallet)
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Task Submission Received 📤',
        message: `Your work for "${task.title}" has been submitted and is now under quality review. A reward of KES ${task.reward.toFixed(2)} will be credited once approved by an administrator.`,
        type: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully and has entered the admin review queue.',
      submission,
    });
  } catch (error: any) {
    console.error('Task submission error:', error);
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Task submission error' }, { status: 400 });
  }
}
