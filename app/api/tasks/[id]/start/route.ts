import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sweepExpiredQuizAttempts } from '@/lib/quizSweep';

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
        { error: 'Account activation required. Please complete your KES 200 activation fee to unlock and start digital tasks.' },
        { status: 403 }
      );
    }

    // Lazy sweep any expired attempts for this task first to release slots
    await sweepExpiredQuizAttempts(taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { category: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status !== 'PUBLISHED' && task.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This task is not currently open for participation.' },
        { status: 400 }
      );
    }

    let isQuiz = false;
    if (task.dataPayloadJson) {
      try {
        const parsed = JSON.parse(task.dataPayloadJson);
        if (parsed.mode === 'QUIZ' || (Array.isArray(parsed.questions) && parsed.questions.length > 0)) {
          isQuiz = true;
        }
      } catch (e) {}
    }

    // Check existing submissions/starts for this user
    const existing = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      if (existing.status === 'IN_PROGRESS') {
        if (isQuiz) {
          const duration = task.durationSeconds || 300;
          const deadline = new Date(existing.startedAt.getTime() + duration * 1000 + 15000);
          if (new Date() > deadline) {
            // Expired attempt: lazy finalize as REJECTED and release slot
            await prisma.$transaction(async (tx) => {
              const updated = await tx.taskSubmission.updateMany({
                where: { id: existing.id, status: 'IN_PROGRESS' },
                data: {
                  status: 'REJECTED',
                  rejectionReason: 'Time limit expired. Attempt closed automatically.',
                  submissionDataJson: JSON.stringify({
                    autoGraded: true,
                    autoRejected: true,
                    passed: false,
                    expired: true,
                  }),
                },
              });
              if (updated.count > 0) {
                await tx.task.update({
                  where: { id: taskId },
                  data: { remainingSlots: { increment: 1 } },
                });
              }
            });
            return NextResponse.json(
              { error: 'Your quiz time limit has expired. You had one attempt.' },
              { status: 400 }
            );
          }
        }
        return NextResponse.json({
          success: true,
          message: isQuiz ? 'Quiz is currently in progress.' : 'Task is already in progress.',
          submission: existing,
          isQuiz,
        });
      }

      if (existing.status === 'UNDER_REVIEW') {
        return NextResponse.json(
          { error: 'You have already submitted this task and it is currently under quality review.' },
          { status: 400 }
        );
      }

      if (existing.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'You have already completed and been rewarded for this task.' },
          { status: 400 }
        );
      }

      if (existing.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'This task submission was rejected. Per platform policy, rejected tasks cannot be restarted or resubmitted.' },
          { status: 400 }
        );
      }
    }

    // Starting a brand new attempt:
    // Slot check and atomic reservation
    if (task.remainingSlots <= 0) {
      return NextResponse.json(
        { error: 'Task slot capacity reached. No slots remaining.' },
        { status: 400 }
      );
    }

    try {
      const submission = await prisma.$transaction(async (tx) => {
        if (isQuiz) {
          // Atomically reserve slot at quiz start
          const slotReserve = await tx.task.updateMany({
            where: { id: taskId, remainingSlots: { gt: 0 } },
            data: { remainingSlots: { decrement: 1 } },
          });

          if (slotReserve.count === 0) {
            throw new Error('SLOT_FULL');
          }
        }

        // Create a new task tracking record with IN_PROGRESS status
        return await tx.taskSubmission.create({
          data: {
            taskId,
            userId: user.id,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: isQuiz
          ? 'Quiz started! The exam timer is now running.'
          : 'Task started! You may now complete the instructions and submit your proof.',
        submission,
        isQuiz,
      });
    } catch (txErr: any) {
      if (txErr.message === 'SLOT_FULL') {
        return NextResponse.json(
          { error: 'Task slot capacity reached. No slots remaining.' },
          { status: 400 }
        );
      }
      if (txErr.code === 'P2002') {
        return NextResponse.json(
          { error: 'An active or submitted attempt already exists for this task.' },
          { status: 400 }
        );
      }
      throw txErr;
    }
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Failed to start task' }, { status: 500 });
  }
}
