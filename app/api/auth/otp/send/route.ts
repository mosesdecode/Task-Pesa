import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Generate a 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous OTPs for this user
    await prisma.otpCode.updateMany({
      where: { userId: user.id, type: 'PHONE', isUsed: false },
      data: { isUsed: true },
    });

    // Save new OTP code
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: 'PHONE',
        expiresAt,
      },
    });

    // Simulated SMS gateway output / demo fallback (In production, integrate with SMS gateway like Africa's Talking)
    console.log(`[SMS OTP GATEWAY] Sending Safaricom OTP to ${user.phone}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `OTP verification code sent to ${user.phone}. (Demo code: ${otpCode})`,
      demoCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 400 });
  }
}
