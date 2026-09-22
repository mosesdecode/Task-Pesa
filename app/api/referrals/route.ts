import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referredUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeCount = referrals.filter((r) => r.status === 'REWARDED' || r.status === 'QUALIFIED').length;
    const pendingCount = referrals.filter((r) => r.status === 'PENDING_ACTIVATION' || r.status === 'PENDING').length;

    // Source total earnings directly from confirmed ledger transactions (Requirement 18)
    const referralTxSum = await prisma.walletTransaction.aggregate({
      where: {
        userId: user.id,
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    const totalEarnings = referralTxSum._sum.amount || 0;

    const origin = req.nextUrl.origin || 'https://taskmint.co.ke';
    const referralLink = `${origin}/register?ref=${user.referralCode}`;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      stats: {
        totalReferrals: referrals.length,
        activeReferrals: activeCount,
        pendingReferrals: pendingCount,
        totalEarnings,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt,
        qualifiedAt: r.qualifiedAt,
        referredUser: r.referredUser,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
