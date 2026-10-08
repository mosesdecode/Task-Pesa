import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Check if user already checked in today (calendar day boundary)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (wallet.lastCheckIn && wallet.lastCheckIn >= todayStart) {
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const msUntilTomorrow = tomorrow.getTime() - now.getTime();
      const hoursLeft = Math.floor(msUntilTomorrow / (1000 * 60 * 60));
      const minutesLeft = Math.floor((msUntilTomorrow % (1000 * 60 * 60)) / (1000 * 60));

      return NextResponse.json({
        error: `You already checked in today. Come back in ${hoursLeft}h ${minutesLeft}m!`,
        alreadyCheckedIn: true,
        nextCheckIn: tomorrow.toISOString(),
      }, { status: 400 });
    }

    // Award 1 coin
    const updatedWallet = await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        coins: { increment: 1 },
        lastCheckIn: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Daily check-in successful! You earned 1 coin 🪙',
      coins: updatedWallet.coins,
      lastCheckIn: updatedWallet.lastCheckIn,
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: error.message || 'Check-in failed' }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { coins: true, lastCheckIn: true },
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const canCheckIn = !wallet.lastCheckIn || wallet.lastCheckIn < todayStart;

    return NextResponse.json({
      coins: wallet.coins,
      lastCheckIn: wallet.lastCheckIn,
      canCheckIn,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch check-in status' }, { status: 403 });
  }
}
