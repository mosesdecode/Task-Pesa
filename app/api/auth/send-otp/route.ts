import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSmsOtp } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { type } = await req.json(); // EMAIL or PHONE

    if (type !== 'EMAIL' && type !== 'PHONE') {
      return NextResponse.json({ error: 'Invalid OTP type. Expected EMAIL or PHONE.' }, { status: 400 });
    }

    // Cooldown check (60s)
    const latestOtp = await prisma.otpCode.findFirst({
      where: { userId: user.id, type },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const elapsed = Math.floor((Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000);
      if (elapsed < 60) {
        return NextResponse.json(
          { error: `Please wait ${60 - elapsed} seconds before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.updateMany({
      where: { userId: user.id, type, isUsed: false },
      data: { isUsed: true },
    });

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        type,
        expiresAt,
      },
    });

    if (type === 'PHONE' && user.phone) {
      await sendSmsOtp(user.phone, code);
    }

    return NextResponse.json({
      success: true,
      message: `OTP code sent to your registered ${type.toLowerCase()}`,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
