import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeKenyanPhone, isSafaricomNumber, formatKenyanPhoneDisplay } from '@/lib/phone';
import { sendSmsOtp } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Please enter your registered Safaricom phone number' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeKenyanPhone(phone.trim());

    if (!isSafaricomNumber(normalizedPhone)) {
      return NextResponse.json(
        {
          error: 'Please enter a valid Kenyan Safaricom phone number (e.g. 07XXXXXXXX or 011XXXXXXX).',
        },
        { status: 400 }
      );
    }

    // Prepare phone format variations for resilient matching
    const rawDigits = normalizedPhone.replace(/^\+/, '');
    const phoneVariants = [
      normalizedPhone,
      rawDigits,
      rawDigits.startsWith('254') ? `0${rawDigits.slice(3)}` : rawDigits,
    ];

    // Find account by phone or mpesaNumber matching any variant
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...phoneVariants.map(p => ({ phone: p })),
          ...phoneVariants.map(p => ({ mpesaNumber: p })),
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this Safaricom phone number. Please check the number or register.' },
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

    // Dispatch SMS via provider abstraction
    await sendSmsOtp(normalizedPhone, code);

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${formatKenyanPhoneDisplay(normalizedPhone)}.`,
      phone: normalizedPhone,
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch password reset code' },
      { status: 500 }
    );
  }
}
