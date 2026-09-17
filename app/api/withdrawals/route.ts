import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requestWithdrawal } from '@/lib/wallet';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { amount, mpesaNumber } = body;

    const numAmount = parseFloat(amount);
    const targetPhone = mpesaNumber || user.mpesaNumber;

    if (!numAmount || isNaN(numAmount)) {
      return NextResponse.json({ error: 'Please enter a valid withdrawal amount' }, { status: 400 });
    }

    if (numAmount < 2500) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is KES 2,500.00' },
        { status: 400 }
      );
    }

    const withdrawal = await requestWithdrawal(user.id, targetPhone, numAmount);

    return NextResponse.json({
      success: true,
      message: `Withdrawal request of KES ${numAmount.toLocaleString()} submitted successfully for Friday payout!`,
      withdrawal,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Withdrawal processing error' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
