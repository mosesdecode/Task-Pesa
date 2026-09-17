import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { creditTaskReward } from '@/lib/wallet';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const taskId = params.id;
    const body = await req.json();
    const { submissionDataJson, proofUrl } = body;

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account activation required. Please pay the KES 100 access fee to unlock task submissions.' },
        { status: 403 }
      );
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.remainingSlots <= 0) {
      return NextResponse.json({ error: 'Task slot capacity reached.' }, { status: 400 });
    }

    // Tier rank check
    const TIER_RANKS: Record<string, number> = {
      BRONZE: 1,
      SILVER: 2,
      GOLD: 3,
      PLATINUM: 4,
    };

    const userTierRank = TIER_RANKS[user.package?.name || 'BRONZE'] || 1;
    const requiredTierRank = TIER_RANKS[task.minPackageTier || 'BRONZE'] || 1;

    if (userTierRank < requiredTierRank) {
      return NextResponse.json(
        { error: `This task requires a ${task.minPackageTier} package tier or higher. Please upgrade your membership tier in the Packages section.` },
        { status: 403 }
      );
    }

    // Daily package submission limit check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySubmissionsCount = await prisma.taskSubmission.count({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart },
      },
    });

    const dailyLimit = user.package?.taskLimitDaily || 5;
    if (todaySubmissionsCount >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily task limit reached (${dailyLimit} tasks) for your ${user.package?.name || 'BRONZE'} package. Upgrade your package to submit more tasks today!` },
        { status: 400 }
      );
    }

    // Check if user already submitted this task
    const existing = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted a response for this task.' }, { status: 400 });
    }

    // Create submission record (Pending Admin Review)
    const submission = await prisma.taskSubmission.create({
      data: {
        taskId,
        userId: user.id,
        status: 'UNDER_REVIEW',
        proofUrl,
        submissionDataJson: typeof submissionDataJson === 'object' ? JSON.stringify(submissionDataJson) : submissionDataJson,
      },
    });

    // Decrement remaining slots
    await prisma.task.update({
      where: { id: taskId },
      data: { remainingSlots: { decrement: 1 } },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Task Submission Received 📤',
        message: `Your work for "${task.title}" has been submitted for quality review. Reward of KES ${task.reward.toFixed(2)} will be credited upon approval.`,
        type: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully and is now under review.',
      submission,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Task submission error' }, { status: 400 });
  }
}
