import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'ALL'; // ALL, UNDER_REVIEW, APPROVED, REJECTED
    const search = searchParams.get('search') || '';

    const whereClause: any = {};
    if (statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (search.trim()) {
      whereClause.OR = [
        { task: { title: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { username: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { fullName: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { phone: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const [taskSubmissions, whatsappSubmissions, counts] = await Promise.all([
      prisma.taskSubmission.findMany({
        where: whereClause,
        include: {
          task: {
            include: { category: true },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              phone: true,
              email: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.whatsappSubmission.findMany({
        where: statusFilter === 'ALL' ? {} : { status: statusFilter === 'UNDER_REVIEW' ? 'PENDING' : statusFilter },
        include: {
          campaign: true,
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              phone: true,
              email: true,
              profilePhoto: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      Promise.all([
        prisma.taskSubmission.count({ where: { status: 'UNDER_REVIEW' } }),
        prisma.taskSubmission.count({ where: { status: 'APPROVED' } }),
        prisma.taskSubmission.count({ where: { status: 'REJECTED' } }),
      ]),
    ]);

    return NextResponse.json({
      taskSubmissions,
      whatsappSubmissions,
      counts: {
        pendingReview: counts[0],
        approved: counts[1],
        rejected: counts[2],
        total: counts[0] + counts[1] + counts[2],
      },
    });
  } catch (error: any) {
    console.error('Admin submissions fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch submissions' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { submissionType, submissionId, action, rejectionReason, adminNotes } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: 'Submission ID and action (APPROVE or REJECT) are required.' },
        { status: 400 }
      );
    }

    // TASK SUBMISSION REVIEW
    if (submissionType === 'TASK' || !submissionType) {
      const sub = await prisma.taskSubmission.findUnique({
        where: { id: submissionId },
        include: { task: true, user: true },
      });

      if (!sub) {
        return NextResponse.json({ error: 'Task submission not found' }, { status: 404 });
      }

      if (action === 'APPROVE') {
        // IDEMPOTENCY CHECK: If already approved, return immediately without re-crediting!
        if (sub.status === 'APPROVED') {
          return NextResponse.json({
            success: true,
            alreadyApproved: true,
            message: 'This submission has already been approved and rewarded. No duplicate payment made.',
          });
        }

        const rewardAmount = sub.task.reward;

        // Perform atomic approval and wallet credit
        await prisma.$transaction(async (tx) => {
          // Double-check inside transaction lock
          const currentSub = await tx.taskSubmission.findUnique({
            where: { id: sub.id },
          });

          if (currentSub?.status === 'APPROVED') {
            return; // Idempotent safeguard
          }

          // 1. Update submission status to APPROVED
          await tx.taskSubmission.update({
            where: { id: sub.id },
            data: {
              status: 'APPROVED',
              rewardPaid: true,
              rewardAmount,
              adminNotes: adminNotes || 'Approved by quality assurance',
              reviewedBy: admin.id,
              reviewedAt: new Date(),
            },
          });

          // 2. Ensure user wallet exists
          let wallet = await tx.wallet.findUnique({ where: { userId: sub.userId } });
          if (!wallet) {
            wallet = await tx.wallet.create({
              data: {
                userId: sub.userId,
                availableBalance: 0.0,
                totalEarned: 0.0,
              },
            });
          }

          // 3. Credit wallet balance
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              availableBalance: { increment: rewardAmount },
              totalEarned: { increment: rewardAmount },
            },
          });

          // 4. Create wallet transaction record
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: sub.userId,
              amount: rewardAmount,
              type: 'TASK_REWARD',
              status: 'COMPLETED',
              description: `Reward for task: ${sub.task.title}`,
              referenceId: sub.id,
            },
          });

          // 5. Send notification to user
          await tx.notification.create({
            data: {
              userId: sub.userId,
              title: 'Task Approved! 💵',
              message: `Your submission for "${sub.task.title}" was approved! KES ${rewardAmount.toFixed(2)} has been credited to your wallet balance.`,
              type: 'SUCCESS',
            },
          });

          // 6. Record in Admin Audit Log
          await tx.adminAuditLog.create({
            data: {
              adminId: admin.id,
              action: 'APPROVE_SUBMISSION',
              targetType: 'TASK_SUBMISSION',
              targetId: sub.id,
              detailsJson: JSON.stringify({
                taskId: sub.taskId,
                taskTitle: sub.task.title,
                workerUserId: sub.userId,
                rewardAmount,
              }),
            },
          });
        });

        return NextResponse.json({
          success: true,
          message: `Submission approved! KES ${sub.task.reward.toFixed(2)} credited to ${sub.user.username}'s wallet.`,
        });
      }

      if (action === 'REJECT') {
        const reason = (rejectionReason || adminNotes || '').trim();
        if (!reason) {
          return NextResponse.json(
            { error: 'A rejection reason is required so the user understands why their submission was declined.' },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          // 1. Update status to REJECTED (Zero wallet credit)
          await tx.taskSubmission.update({
            where: { id: sub.id },
            data: {
              status: 'REJECTED',
              rejectionReason: reason,
              adminNotes: reason,
              reviewedBy: admin.id,
              reviewedAt: new Date(),
            },
          });

          // 2. Notify user of rejection with the specific reason
          await tx.notification.create({
            data: {
              userId: sub.userId,
              title: 'Task Submission Rejected ❌',
              message: `Your submission for "${sub.task.title}" was rejected. Feedback: "${reason}"`,
              type: 'WARNING',
            },
          });

          // 3. Record in Admin Audit Log
          await tx.adminAuditLog.create({
            data: {
              adminId: admin.id,
              action: 'REJECT_SUBMISSION',
              targetType: 'TASK_SUBMISSION',
              targetId: sub.id,
              detailsJson: JSON.stringify({
                taskId: sub.taskId,
                workerUserId: sub.userId,
                rejectionReason: reason,
              }),
            },
          });
        });

        return NextResponse.json({
          success: true,
          message: 'Submission rejected. User has been notified with the feedback reason.',
        });
      }
    }

    // WHATSAPP SUBMISSION REVIEW
    if (submissionType === 'WHATSAPP') {
      const sub = await prisma.whatsappSubmission.findUnique({
        where: { id: submissionId },
        include: { campaign: true, user: true },
      });

      if (!sub) {
        return NextResponse.json({ error: 'WhatsApp submission not found' }, { status: 404 });
      }

      if (action === 'APPROVE') {
        if (sub.status === 'APPROVED') {
          return NextResponse.json({ success: true, message: 'Already approved' });
        }

        const rewardAmount = sub.campaign.reward;

        await prisma.$transaction(async (tx) => {
          await tx.whatsappSubmission.update({
            where: { id: sub.id },
            data: {
              status: 'APPROVED',
              adminNotes: adminNotes || 'Proof verified',
            },
          });

          let wallet = await tx.wallet.findUnique({ where: { userId: sub.userId } });
          if (!wallet) {
            wallet = await tx.wallet.create({
              data: { userId: sub.userId, availableBalance: 0, totalEarned: 0 },
            });
          }

          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              availableBalance: { increment: rewardAmount },
              totalEarned: { increment: rewardAmount },
            },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: sub.userId,
              amount: rewardAmount,
              type: 'WHATSAPP_REWARD',
              status: 'COMPLETED',
              description: `WhatsApp Campaign: ${sub.campaign.campaignName}`,
              referenceId: sub.id,
            },
          });

          await tx.notification.create({
            data: {
              userId: sub.userId,
              title: 'WhatsApp Status Reward Approved! 💵',
              message: `Your proof for "${sub.campaign.campaignName}" was approved. KES ${rewardAmount.toFixed(2)} credited to your wallet.`,
              type: 'SUCCESS',
            },
          });

          await tx.adminAuditLog.create({
            data: {
              adminId: admin.id,
              action: 'APPROVE_WHATSAPP_SUBMISSION',
              targetType: 'WHATSAPP_SUBMISSION',
              targetId: sub.id,
            },
          });
        });

        return NextResponse.json({ success: true, message: 'WhatsApp submission approved & reward credited!' });
      }

      if (action === 'REJECT') {
        const reason = (rejectionReason || adminNotes || '').trim();
        if (!reason) {
          return NextResponse.json(
            { error: 'A rejection reason is required so the user understands why their submission was declined.' },
            { status: 400 }
          );
        }
        await prisma.whatsappSubmission.update({
          where: { id: sub.id },
          data: { status: 'REJECTED', adminNotes: reason },
        });

        await prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'WhatsApp Campaign Proof Rejected ❌',
            message: `Your proof for "${sub.campaign.campaignName}" was rejected: ${reason}`,
            type: 'WARNING',
          },
        });

        return NextResponse.json({ success: true, message: 'WhatsApp submission rejected.' });
      }
    }

    return NextResponse.json({ error: 'Invalid submission review request' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin submission review error:', error);
    return NextResponse.json({ error: error.message || 'Review operation failed' }, { status: 500 });
  }
}
