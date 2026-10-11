import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSmsOtp } from '@/lib/sms';
import { getWithdrawalEligibility } from '@/lib/wallet';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { amount, mpesaNumber } = body;

    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid withdrawal amount.' }, { status: 400 });
    }

    if (numAmount < 500) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is KES 500.00' }, { status: 400 });
    }

    // Check user's wallet available balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.availableBalance < numAmount) {
      return NextResponse.json(
        { error: `Insufficient wallet balance. Available: KES ${(wallet?.availableBalance || 0).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check withdrawal eligibility rules
    const eligibility = await getWithdrawalEligibility(user.id);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason || 'You are not eligible to withdraw at this time.' }, { status: 400 });
    }

    const targetPhone = mpesaNumber || user.mpesaNumber || user.phone;

    // Check cooldown: 60s
    const latestOtp = await prisma.otpCode.findFirst({
      where: { userId: user.id, type: 'WITHDRAWAL' },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000);
      const COOLDOWN = 60;
      if (elapsedSeconds < COOLDOWN) {
        const remaining = COOLDOWN - elapsedSeconds;
        return NextResponse.json(
          { error: `Please wait ${remaining} seconds before requesting a new withdrawal code.`, retryAfter: remaining },
          { status: 429 }
        );
      }
    }

    // Invalidate prior active withdrawal OTPs
    await prisma.otpCode.updateMany({
      where: { userId: user.id, type: 'WITHDRAWAL', isUsed: false },
      data: { isUsed: true },
    });

    // Generate 6-digit OTP code (10 min expiry)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: 'WITHDRAWAL',
        expiresAt,
      },
    });

    // Dispatch SMS via Africa's Talking
    const smsResult = await sendSmsOtp(targetPhone, otpCode, 'WITHDRAWAL');

    return NextResponse.json({
      success: true,
      message: `A 6-digit withdrawal authorization code was sent to ${targetPhone}.`,
      phone: targetPhone,
      smsProvider: smsResult.provider,
      demoCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('Withdrawal send OTP error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send withdrawal OTP' }, { status: 400 });
  }
}
