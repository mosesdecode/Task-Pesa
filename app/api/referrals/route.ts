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

    const activeCount = referrals.filter((r) => r.status === 'QUALIFIED').length;
    const pendingCount = referrals.filter((r) => r.status === 'PENDING').length;
    const totalEarnings = referrals
      .filter((r) => r.status === 'QUALIFIED')
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    const origin = req.nextUrl.origin || 'https://taskpesa.co.ke';
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
      referrals,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
