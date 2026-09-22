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

    if (task.remainingSlots <= 0) {
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

    const dailyLimit = user.package?.taskLimitDaily || 10;
    if (todaySubmissionsCount >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily task limit reached (${dailyLimit} tasks) for your account package. Upgrade your package to submit more tasks today!` },
        { status: 400 }
      );
    }

    // Check if user already has an existing task submission record
    const existing = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    let submission;

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

      // If IN_PROGRESS or REJECTED: update to UNDER_REVIEW
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
      // Create new submission record in UNDER_REVIEW state
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

    // Decrement remaining slots safely
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
