import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getFinancialConfig, updateFinancialConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    // Parallel aggregate queries from real database ledger records (Requirements 5 & 6)
    const [
      config,
      totalActivationDeposits,
      totalActivationRevenueAgg,
      totalAdminEarningsAgg,
      todayAdminEarningsAgg,
      thisMonthAdminEarningsAgg,
      totalReferralRewardsAgg,
      totalPlatformRetainedAgg,
      pendingDepositsAgg,
      ledgerEntries,
    ] = await Promise.all([
      getFinancialConfig(),

      // Count of completed activation deposits
      prisma.deposit.count({
        where: { type: 'ACTIVATION', status: 'COMPLETED' },
      }),

      // Total revenue from activation payments
      prisma.financialLedger.aggregate({
        where: { type: 'ACTIVATION_PAYMENT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),

      // Total Admin Activation Earnings
      prisma.financialLedger.aggregate({
        where: { type: 'ACTIVATION_ADMIN_EARNING', status: 'COMPLETED' },
        _sum: { amount: true },
      }),

      // Today's Admin Activation Earnings
      prisma.financialLedger.aggregate({
        where: {
          type: 'ACTIVATION_ADMIN_EARNING',
          status: 'COMPLETED',
          createdAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),

      // This Month's Admin Activation Earnings
      prisma.financialLedger.aggregate({
        where: {
          type: 'ACTIVATION_ADMIN_EARNING',
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Total Referral Rewards Paid
      prisma.financialLedger.aggregate({
        where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' },
        _sum: { amount: true },
      }),

      // Total Platform Retained Amount (unreferred activations)
      prisma.financialLedger.aggregate({
        where: { type: 'PLATFORM_RETAINED_AMOUNT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),

      // Pending activation deposits
      prisma.deposit.aggregate({
        where: { type: 'ACTIVATION', status: 'PENDING' },
        _count: true,
        _sum: { amount: true },
      }),

      // Ledger entries query with optional type & search filters
      prisma.financialLedger.findMany({
        where: {
          type: filterType && filterType !== 'ALL' ? filterType : undefined,
          OR: search
            ? [
                { reference: { contains: search, mode: 'insensitive' } },
                { source: { contains: search, mode: 'insensitive' } },
                { user: { username: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search, mode: 'insensitive' } } },
              ]
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const totalActivationRevenue = totalActivationRevenueAgg._sum.amount || 0;
    const totalAdminEarnings = totalAdminEarningsAgg._sum.amount || 0;
    const todayAdminEarnings = todayAdminEarningsAgg._sum.amount || 0;
    const thisMonthAdminEarnings = thisMonthAdminEarningsAgg._sum.amount || 0;
    const totalReferralRewardsPaid = totalReferralRewardsAgg._sum.amount || 0;
    const totalPlatformRetained = totalPlatformRetainedAgg._sum.amount || 0;
    const pendingDepositsCount = pendingDepositsAgg._count || 0;
    const pendingDepositsAmount = pendingDepositsAgg._sum.amount || 0;

    return NextResponse.json({
      success: true,
      config,
      stats: {
        totalActivationPayments: totalActivationDeposits,
        totalActivationRevenue,
        totalAdminEarnings,
        todayAdminEarnings,
        thisMonthAdminEarnings,
        totalReferralRewardsPaid,
        totalPlatformRetained,
        pendingDepositsCount,
        pendingDepositsAmount,
      },
      ledgerEntries,
    });
  } catch (error: any) {
    console.error('Admin earnings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin earnings' }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { activationFeeKES, adminActivationEarningKES, referralRewardKES, platformRetainedAmountKES } = body;

    const updatedConfig = await updateFinancialConfig(admin.id, {
      activationFeeKES,
      adminActivationEarningKES,
      referralRewardKES,
      platformRetainedAmountKES,
    });

    return NextResponse.json({
      success: true,
      message: 'Financial parameters updated successfully.',
      config: updatedConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update financial configuration' }, { status: 400 });
  }
}
