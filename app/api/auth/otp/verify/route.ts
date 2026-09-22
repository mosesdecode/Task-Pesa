import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit numeric verification code' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: 'PHONE',
        code: cleanCode,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP verification code. Please request a new code.' },
        { status: 400 }
      );
    }

    // Mark OTP as used and user's phone as verified in a transaction
    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Safaricom Phone Verified ✓',
          message: `Your Safaricom phone number (${user.phone}) has been verified. You can now request M-Pesa withdrawals directly to this line.`,
          type: 'SUCCESS',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Safaricom phone number verified successfully! You now have full withdrawal and task privileges.',
      phoneVerified: true,
    });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: error.message || 'OTP verification failed' }, { status: 400 });
  }
}
