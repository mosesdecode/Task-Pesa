import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { creditTaskReward } from '@/lib/wallet';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const taskSubmissions = await prisma.taskSubmission.findMany({
      where: { status: 'UNDER_REVIEW' },
      include: {
        task: true,
        user: { select: { id: true, fullName: true, username: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const whatsappSubmissions = await prisma.whatsappSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        campaign: true,
        user: { select: { id: true, fullName: true, username: true, phone: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({
      taskSubmissions,
      whatsappSubmissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { submissionType, submissionId, action, adminNotes } = body; // submissionType: 'TASK' | 'WHATSAPP', action: 'APPROVE' | 'REJECT'

    if (submissionType === 'TASK') {
      const sub = await prisma.taskSubmission.findUnique({
        where: { id: submissionId },
        include: { task: true },
      });

      if (!sub) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      if (action === 'APPROVE') {
        await prisma.taskSubmission.update({
          where: { id: sub.id },
          data: {
            status: 'APPROVED',
            adminNotes: adminNotes || 'Approved by quality assurance',
            reviewedAt: new Date(),
          },
        });

        // Credit wallet automatically
        await creditTaskReward(sub.userId, sub.task.reward, sub.task.title, sub.id);

        return NextResponse.json({ success: true, message: 'Submission approved and reward credited!' });
      } else {
        await prisma.taskSubmission.update({
          where: { id: sub.id },
          data: {
            status: 'REJECTED',
            adminNotes: adminNotes || 'Submission did not meet accuracy standards',
            reviewedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'Task Submission Rejected ❌',
            message: `Your work for "${sub.task.title}" was rejected. Feedback: ${adminNotes || 'Quality standards not met'}`,
            type: 'WARNING',
          },
        });

        return NextResponse.json({ success: true, message: 'Submission rejected.' });
      }
    }

    if (submissionType === 'WHATSAPP') {
      const sub = await prisma.whatsappSubmission.findUnique({
        where: { id: submissionId },
        include: { campaign: true },
      });

      if (!sub) {
        return NextResponse.json({ error: 'WhatsApp submission not found' }, { status: 404 });
      }

      if (action === 'APPROVE') {
        await prisma.whatsappSubmission.update({
          where: { id: sub.id },
          data: {
            status: 'APPROVED',
            adminNotes: adminNotes || 'Proof verified',
          },
        });

        await creditTaskReward(sub.userId, sub.campaign.reward, `WhatsApp Campaign: ${sub.campaign.campaignName}`, sub.id);

        return NextResponse.json({ success: true, message: 'WhatsApp submission approved & reward credited!' });
      } else {
        await prisma.whatsappSubmission.update({
          where: { id: sub.id },
          data: {
            status: 'REJECTED',
            adminNotes: adminNotes || 'Invalid screenshot proof',
          },
        });

        await prisma.notification.create({
          data: {
            userId: sub.userId,
            title: 'WhatsApp Campaign Proof Rejected ❌',
            message: `Screenshot for "${sub.campaign.campaignName}" was rejected. Reason: ${adminNotes || 'Invalid screenshot'}`,
            type: 'WARNING',
          },
        });

        return NextResponse.json({ success: true, message: 'WhatsApp submission rejected.' });
      }
    }

    return NextResponse.json({ error: 'Invalid submission review payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
