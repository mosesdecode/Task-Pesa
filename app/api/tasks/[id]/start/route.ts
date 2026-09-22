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
        { error: 'Account activation required. Please complete your KES 200 activation fee to unlock and start digital tasks.' },
        { status: 403 }
      );
    }

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

    if (task.remainingSlots <= 0) {
      return NextResponse.json(
        { error: 'Task slot capacity reached. No slots remaining.' },
        { status: 400 }
      );
    }

    // Check existing submissions/starts
    const existing = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      if (existing.status === 'IN_PROGRESS') {
        return NextResponse.json({
          success: true,
          message: 'Task is already in progress.',
          submission: existing,
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
    }

    // Create a new task tracking record with IN_PROGRESS status
    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        userId: user.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task started! You may now complete the instructions and submit your proof.',
      submission,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Failed to start task' }, { status: 500 });
  }
}
