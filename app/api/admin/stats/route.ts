import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      suspendedUsers,
      totalWallets,
      walletsWithBalance,
      walletBalanceSum,
      coinsAggregate,
      withdrawalsPaid,
      withdrawalsPending,
      pendingTaskSubmissions,
      approvedTaskSubmissions,
      rejectedTaskSubmissions,
      pendingWhatsappSubmissions,
      pendingCoinRedemptions,
      publishedTasks,
      totalTasks,
      activeAds,
      categoriesCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { phoneVerified: true } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),

      // Real User Wallet calculations (Requirement 14)
      prisma.wallet.count(),
      prisma.wallet.count({ where: { availableBalance: { gt: 0 } } }),
      prisma.wallet.aggregate({ _sum: { availableBalance: true, pendingBalance: true, totalEarned: true } }),

      // Total coins held by all users
      prisma.wallet.aggregate({ _sum: { coins: true } }),

      prisma.withdrawal.aggregate({
        where: { status: { in: ['PAID', 'COMPLETED'] } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.withdrawal.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),

      // Real Submission counts
      prisma.taskSubmission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.taskSubmission.count({ where: { status: 'APPROVED' } }),
      prisma.taskSubmission.count({ where: { status: 'REJECTED' } }),
      prisma.whatsappSubmission.count({ where: { status: 'PENDING' } }),
      (prisma as any).coinRedemption.count({ where: { status: 'PENDING' } }),

      // Task Counts
      prisma.task.count({ where: { status: { in: ['PUBLISHED', 'ACTIVE'] } } }),
      prisma.task.count(),
      prisma.advertisement.count({ where: { status: 'ACTIVE' } }),
      prisma.taskCategory.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        suspended: suspendedUsers,
      },
      wallets: {
        totalWallets,
        activeWallets: activeUsers,
        verifiedWallets: verifiedUsers,
        walletsWithBalance,
        totalUserBalanceKES: walletBalanceSum._sum.availableBalance || 0,
        pendingBalanceKES: walletBalanceSum._sum.pendingBalance || 0,
        totalEarnedKES: walletBalanceSum._sum.totalEarned || 0,
        completedWithdrawalsKES: withdrawalsPaid._sum.amount || 0,
        completedWithdrawalsCount: withdrawalsPaid._count || 0,
        pendingWithdrawalsKES: withdrawalsPending._sum.amount || 0,
        pendingWithdrawalsCount: withdrawalsPending._count || 0,
        totalCoins: coinsAggregate._sum.coins || 0,
      },
      tasks: {
        total: totalTasks,
        published: publishedTasks,
        categoriesCount,
      },
      submissions: {
        pendingReview: pendingTaskSubmissions + pendingWhatsappSubmissions + (pendingCoinRedemptions || 0),
        pendingTasks: pendingTaskSubmissions,
        pendingWhatsapp: pendingWhatsappSubmissions,
        pendingCoins: pendingCoinRedemptions || 0,
        approved: approvedTaskSubmissions,
        rejected: rejectedTaskSubmissions,
      },
      ads: {
        active: activeAds,
      },
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    
    // If it's our auth error from requireAdmin, it will say "Unauthorized" or "Forbidden"
    if (error.message === 'Unauthorized' || error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    // Otherwise it's a database or server error, so return 500
    return NextResponse.json({ error: 'Internal Server Error fetching stats' }, { status: 500 });
  }
}
