import { prisma } from './prisma';

export interface AntiFraudCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function validateAdWatchDuration(
  userId: string,
  adId: string,
  clientWatchTimeSeconds: number
): Promise<AntiFraudCheckResult> {
  const ad = await prisma.advertisement.findUnique({ where: { id: adId } });

  if (!ad) {
    return { allowed: false, reason: 'Advertisement not found' };
  }

  // 1. Verify minimum watch time server-side
  if (clientWatchTimeSeconds < ad.durationSeconds) {
    return {
      allowed: false,
      reason: `Ad view invalidated. Required viewing duration is ${ad.durationSeconds} seconds, but client submitted ${clientWatchTimeSeconds} seconds.`,
    };
  }

  // 2. Verify user hasn't exceeded daily ad view limit
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayViewsCount = await prisma.adView.count({
    where: {
      userId,
      viewedAt: { gte: startOfDay },
      rewarded: true,
    },
  });

  if (todayViewsCount >= ad.dailyLimit) {
    return {
      allowed: false,
      reason: `Daily ad view limit reached (${ad.dailyLimit} ads per day). Come back tomorrow!`,
    };
  }

  // 3. Prevent duplicate reward for the exact same ad within 1 hour
  const recentSameAdView = await prisma.adView.findFirst({
    where: {
      userId,
      adId,
      rewarded: true,
      viewedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentSameAdView) {
    return {
      allowed: false,
      reason: 'You have already watched and claimed rewards for this advertisement recently.',
    };
  }

  return { allowed: true };
}

export async function validateReferralEligibility(
  referrerId: string,
  newPhone: string
): Promise<AntiFraudCheckResult> {
  const referrer = await prisma.user.findUnique({ where: { id: referrerId } });

  if (!referrer) {
    return { allowed: false, reason: 'Invalid referrer code' };
  }

  // Prevent self referral by phone
  if (referrer.phone === newPhone || referrer.mpesaNumber === newPhone) {
    return { allowed: false, reason: 'Self-referral is strictly prohibited.' };
  }

  return { allowed: true };
}
