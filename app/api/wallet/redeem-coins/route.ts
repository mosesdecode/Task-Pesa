import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MIN_COINS_TO_REDEEM = 50;
const COINS_PER_KES = 5; // 5 coins = KES 1

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const redemptions = await (prisma as any).coinRedemption.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ redemptions });
  } catch (error: any) {
    return NextResponse.json({ redemptions: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    if (wallet.coins < MIN_COINS_TO_REDEEM) {
      return NextResponse.json(
        {
          error: `Minimum of ${MIN_COINS_TO_REDEEM} coins required to redeem. You currently have ${wallet.coins} coins.`,
        },
        { status: 400 }
      );
    }

    // Check if user already has a pending redemption request
    const existingPending = await (prisma as any).coinRedemption.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          error: `You already have a pending coin redemption request of ${existingPending.coins} coins (KES ${existingPending.kesAmount.toFixed(2)}) awaiting admin review.`,
        },
        { status: 400 }
      );
    }

    // Calculate KES value: floor to whole multiples of COINS_PER_KES
    const redeemableCoins = Math.floor(wallet.coins / COINS_PER_KES) * COINS_PER_KES;
    const kesValue = redeemableCoins / COINS_PER_KES;

    // Deduct coins immediately and create a PENDING CoinRedemption record
    const [updatedWallet, redemption] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          coins: { decrement: redeemableCoins },
        },
      }),
      (prisma as any).coinRedemption.create({
        data: {
          userId: user.id,
          coins: redeemableCoins,
          kesAmount: kesValue,
          status: 'PENDING',
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Coin Redemption Submitted 🪙',
          message: `Your request to redeem ${redeemableCoins} coins for KES ${kesValue.toFixed(2)} has been submitted and is pending admin approval.`,
          type: 'INFO',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Redemption request for ${redeemableCoins} coins (KES ${kesValue.toFixed(2)}) submitted successfully! It is now pending admin approval.`,
      redemption,
      remainingCoins: updatedWallet.coins,
    });
  } catch (error: any) {
    console.error('Coin redemption error:', error);
    return NextResponse.json({ error: error.message || 'Redemption request failed' }, { status: 500 });
  }
}
