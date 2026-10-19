import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sweepExpiredQuizAttempts } from '@/lib/quizSweep';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const taskId = params.id;

    // Idempotent lazy sweep for expired in-progress quiz attempts for this task
    await sweepExpiredQuizAttempts(taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Determine if task is a structured quiz
    let isQuiz = false;
    let safeFormPayload: any = null;

    if (task.dataPayloadJson) {
      try {
        const parsed = JSON.parse(task.dataPayloadJson);
        if (parsed.mode === 'QUIZ' || (Array.isArray(parsed.questions) && parsed.questions.length > 0)) {
          isQuiz = true;
          // SECURITY RULE: Strictly strip correct answers before delivering to browser!
          safeFormPayload = {
            mode: parsed.mode || 'QUIZ',
            passScorePercent: parsed.passScorePercent || 80,
            questions: (parsed.questions || []).map((q: any) => {
              const { correctAnswer, ...safeQuestion } = q;
              return safeQuestion;
            }),
          };
        } else if (parsed.mode === 'MEDIA') {
          // SECURITY RULE: Strip comprehension correctAnswer for MEDIA tasks
          const { comprehension, ...restMedia } = parsed;
          safeFormPayload = {
            ...restMedia,
            comprehension: comprehension
              ? {
                  question: comprehension.question,
                  options: comprehension.options || [],
                }
              : null,
          };
        } else {
          safeFormPayload = parsed;
        }
      } catch (e) {
        console.error('Error parsing dataPayloadJson in GET /api/tasks/[id]:', e);
      }
    }

    // Fetch this user's submission record if any
    const userSub = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    // Parse submission data if available
    let parsedSubmissionData: any = null;
    if (userSub?.submissionDataJson) {
      try {
        parsedSubmissionData = JSON.parse(userSub.submissionDataJson);
      } catch (e) {}
    }

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        rules: task.rules,
        reward: task.reward,
        durationSeconds: task.durationSeconds || 300,
        totalSlots: task.totalSlots,
        remainingSlots: task.remainingSlots,
        proofRequired: task.proofRequired,
        externalUrl: task.externalUrl,
        category: task.category,
        formPayload: safeFormPayload,
        isQuiz,
        isMedia: safeFormPayload?.mode === 'MEDIA' || Boolean(safeFormPayload?.mediaType),
      },
      userSubmission: userSub
        ? {
            id: userSub.id,
            status: userSub.status,
            startedAt: userSub.startedAt,
            submittedAt: userSub.submittedAt,
            rejectionReason: userSub.rejectionReason,
            savedAnswers: parsedSubmissionData?.answers || {},
            score: parsedSubmissionData?.score,
            results: parsedSubmissionData?.results, // Right/wrong flags (no secret answers)
            passed: parsedSubmissionData?.passed,
            autoGraded: parsedSubmissionData?.autoGraded,
            serverTime: now.toISOString(),
            deadline:
              userSub.status === 'IN_PROGRESS' && userSub.startedAt
                ? new Date(userSub.startedAt.getTime() + (task.durationSeconds || 300) * 1000).toISOString()
                : null,
          }
        : null,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch task detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch task details' }, { status: 500 });
  }
}
