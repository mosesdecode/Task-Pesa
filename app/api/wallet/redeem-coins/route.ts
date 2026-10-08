import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MIN_COINS_TO_REDEEM = 50;
const COINS_PER_KES = 5; // 5 coins = KES 1

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
      return NextResponse.json({
        error: `You need at least ${MIN_COINS_TO_REDEEM} coins to redeem. You currently have ${wallet.coins} coins.`,
      }, { status: 400 });
    }

    // Calculate KES value: floor to whole multiples of COINS_PER_KES
    const redeemableCoins = Math.floor(wallet.coins / COINS_PER_KES) * COINS_PER_KES;
    const kesValue = redeemableCoins / COINS_PER_KES;

    // Deduct coins and credit KES to available balance atomically
    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: user.id },
        data: {
          coins: { decrement: redeemableCoins },
          availableBalance: { increment: kesValue },
          totalEarned: { increment: kesValue },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          amount: kesValue,
          type: 'COIN_REDEMPTION',
          status: 'COMPLETED',
          description: `Redeemed ${redeemableCoins} coins for KES ${kesValue.toFixed(2)}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${redeemableCoins} coins for KES ${kesValue.toFixed(2)}!`,
      coinsRedeemed: redeemableCoins,
      kesEarned: kesValue,
      remainingCoins: updatedWallet.coins,
      newBalance: updatedWallet.availableBalance,
    });
  } catch (error: any) {
    console.error('Coin redemption error:', error);
    return NextResponse.json({ error: error.message || 'Redemption failed' }, { status: 500 });
  }
}
