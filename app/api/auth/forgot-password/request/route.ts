import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp } from '@/lib/email';
import { normalizeKenyanPhone } from '@/lib/phone';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone } = body;

    const rawInput = (email || phone || '').toString().trim();
    if (!rawInput) {
      return NextResponse.json(
        { error: 'Please enter your registered email address.' },
        { status: 400 }
      );
    }

    let user = null;

    if (rawInput.includes('@')) {
      const normalizedEmail = rawInput.toLowerCase();
      user = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: 'insensitive' },
        },
      });
    } else {
      // Fallback: match by phone variants if user entered phone
      const normalizedPhone = normalizeKenyanPhone(rawInput);
      const rawDigits = normalizedPhone.replace(/^\+/, '');
      const phoneVariants = [
        normalizedPhone,
        rawDigits,
        rawDigits.startsWith('254') ? `0${rawDigits.slice(3)}` : rawDigits,
      ];

      user = await prisma.user.findFirst({
        where: {
          OR: [
            ...phoneVariants.map(p => ({ phone: p })),
            ...phoneVariants.map(p => ({ mpesaNumber: p })),
          ],
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address. Please check the address or create a new account.' },
        { status: 404 }
      );
    }

    // Cooldown check (60s)
    const latestOtp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const elapsed = Math.floor((Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000);
      const COOLDOWN = 60;
      if (elapsed < COOLDOWN) {
        const remaining = COOLDOWN - elapsed;
        return NextResponse.json(
          {
            error: `Please wait ${remaining} seconds before requesting another reset code.`,
            retryAfter: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Rate limiting: Maximum 5 reset requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.otpCode.count({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum password reset attempts reached (5 per hour). Please try again later.' },
        { status: 429 }
      );
    }

    // Generate secure 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused reset codes
    await prisma.otpCode.updateMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Create new OTP record
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        type: 'PASSWORD_RESET',
        expiresAt,
        isUsed: false,
      },
    });

    // Dispatch OTP via Email
    const emailResult = await sendEmailOtp(user.email, code, 'PASSWORD_RESET', user.fullName);

    if (!emailResult.success && process.env.EMAIL_USER) {
      console.error(`[PASSWORD RESET OTP DISPATCH FAILED] To: ${user.email}, Error: ${emailResult.error}`);
      return NextResponse.json(
        {
          error: `Failed to deliver reset code to ${user.email} (${emailResult.error || 'Email gateway error'}). Please try again.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}.`,
      email: user.email,
      demoCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch password reset code' },
      { status: 500 }
    );
  }
}
