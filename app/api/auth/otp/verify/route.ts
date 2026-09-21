import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid 6-digit OTP code' }, { status: 400 });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: 'PHONE',
        code: code.trim(),
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP verification code. Please request a new code.' }, { status: 400 });
    }

    // Mark OTP as used and user's phone as verified
    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Safaricom phone number verified successfully! You can now make withdrawals.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'OTP verification failed' }, { status: 400 });
  }
}
