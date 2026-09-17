import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAdWatchDuration } from '@/lib/antifraud';
import { creditTaskReward } from '@/lib/wallet';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const adId = params.id;
    const body = await req.json();
    const { watchTimeSeconds } = body;

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account activation required. Please pay KES 100 access fee to earn ad rewards.' },
        { status: 403 }
      );
    }

    // Run server-side anti-fraud check
    const antiFraud = await validateAdWatchDuration(user.id, adId, watchTimeSeconds || 0);
    if (!antiFraud.allowed) {
      return NextResponse.json({ error: antiFraud.reason }, { status: 400 });
    }

    const ad = await prisma.advertisement.findUnique({ where: { id: adId } });
    if (!ad) {
      return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    }

    // Tier rank check
    const TIER_RANKS: Record<string, number> = {
      BRONZE: 1,
      SILVER: 2,
      GOLD: 3,
      PLATINUM: 4,
    };

    const userTierRank = TIER_RANKS[user.package?.name || 'BRONZE'] || 1;
    const requiredTierRank = TIER_RANKS[ad.minPackageTier || 'BRONZE'] || 1;

    if (userTierRank < requiredTierRank) {
      return NextResponse.json(
        { error: `This sponsored ad requires a ${ad.minPackageTier} package tier or higher. Please upgrade your membership tier in the Packages section.` },
        { status: 403 }
      );
    }

    // Record AdView
    const adView = await prisma.adView.create({
      data: {
        adId,
        userId: user.id,
        rewarded: true,
        watchTimeSeconds,
      },
    });

    // Credit user's wallet immediately for verified ad view
    await creditTaskReward(user.id, ad.reward, `Watched Ad: ${ad.title}`, adView.id);

    return NextResponse.json({
      success: true,
      message: `Successfully verified ad view! KES ${ad.reward.toFixed(2)} credited to your wallet.`,
      reward: ad.reward,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Ad verification error' }, { status: 400 });
  }
}
