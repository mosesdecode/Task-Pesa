import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUserWallet } from '@/lib/wallet';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const wallet = await getUserWallet(user.id);

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { requestedAt: 'desc' },
      take: 20,
    });

    // Distinct earnings breakdowns from confirmed ledger transactions (Requirement 20)
    const [taskEarningsAgg, referralEarningsAgg] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { userId: user.id, type: 'TASK_REWARD', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { userId: user.id, type: 'REFERRAL_REWARD', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const taskEarnings = taskEarningsAgg._sum.amount || 0;
    const referralEarnings = referralEarningsAgg._sum.amount || 0;

    return NextResponse.json({
      wallet,
      taskEarnings,
      referralEarnings,
      pendingEarnings: wallet.pendingBalance || 0,
      transactions,
      withdrawals,
      minWithdrawal: 2500.0,
      nextPayoutDay: 'Friday',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch wallet info' }, { status: 401 });
  }
}
