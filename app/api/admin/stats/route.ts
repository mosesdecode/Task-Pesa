import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const pendingUsers = await prisma.user.count({ where: { status: 'PENDING_ACTIVATION' } });
    const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });

    const deposits = await prisma.deposit.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    const withdrawalsPaid = await prisma.withdrawal.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    const withdrawalsPending = await prisma.withdrawal.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    });

    const pendingSubmissionsCount = await prisma.taskSubmission.count({
      where: { status: 'UNDER_REVIEW' },
    });

    const pendingWhatsappCount = await prisma.whatsappSubmission.count({
      where: { status: 'PENDING' },
    });

    const activeTasksCount = await prisma.task.count({ where: { status: 'ACTIVE' } });
    const activeAdsCount = await prisma.advertisement.count({ where: { status: 'ACTIVE' } });
    const activeWhatsappCampaignsCount = await prisma.whatsappCampaign.count({ where: { status: 'ACTIVE' } });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
      },
      financials: {
        totalDepositsKES: deposits._sum.amount || 0,
        totalDepositsCount: deposits._count || 0,
        totalWithdrawnKES: withdrawalsPaid._sum.amount || 0,
        pendingWithdrawalsKES: withdrawalsPending._sum.amount || 0,
        pendingWithdrawalsCount: withdrawalsPending._count || 0,
      },
      content: {
        pendingSubmissions: pendingSubmissionsCount + pendingWhatsappCount,
        activeTasks: activeTasksCount,
        activeAds: activeAdsCount,
        activeWhatsappCampaigns: activeWhatsappCampaignsCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Admin authentication failed' }, { status: 403 });
  }
}
