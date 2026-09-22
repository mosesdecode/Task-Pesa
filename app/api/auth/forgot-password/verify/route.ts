import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeKenyanPhone } from '@/lib/phone';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code || typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Please provide both your Safaricom phone number and the 6-digit code' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeKenyanPhone(phone.trim());
    const cleanCode = code.trim();

    const rawDigits = normalizedPhone.replace(/^\+/, '');
    const phoneVariants = [
      normalizedPhone,
      rawDigits,
      rawDigits.startsWith('254') ? `0${rawDigits.slice(3)}` : rawDigits,
    ];

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...phoneVariants.map(p => ({ phone: p })),
          ...phoneVariants.map(p => ({ mpesaNumber: p })),
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        code: cleanCode,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please request a new code.' },
        { status: 400 }
      );
    }

    // Generate secure single-use reset token
    const resetToken = crypto.randomUUID();

    // Attach reset token to the verified OTP record
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: {
        resetToken,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Code verified successfully. You may now choose a new password.',
      resetToken,
    });
  } catch (error: any) {
    console.error('Password reset verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
