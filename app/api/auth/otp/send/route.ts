import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeKenyanPhone, isSafaricomNumber, formatKenyanPhoneDisplay } from '@/lib/phone';
import { sendSmsOtp } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {}

    // Target phone number: either submitted in body or user's registered phone
    const rawPhone = body?.phone || user.phone;
    if (!rawPhone) {
      return NextResponse.json({ error: 'Please provide a valid Safaricom phone number' }, { status: 400 });
    }

    const normalizedPhone = normalizeKenyanPhone(rawPhone);

    // Validate Safaricom network
    if (!isSafaricomNumber(normalizedPhone)) {
      return NextResponse.json(
        {
          error: 'Please enter a valid Kenyan Safaricom phone number (e.g. 07XXXXXXXX or 011XXXXXXX). Non-Safaricom phone numbers cannot receive Daraja OTPs.',
        },
        { status: 400 }
      );
    }

    // Check resend cooldown: 60 seconds
    const latestOtp = await prisma.otpCode.findFirst({
      where: { userId: user.id, type: 'PHONE' },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000);
      const COOLDOWN = 60;
      if (elapsedSeconds < COOLDOWN) {
        const remaining = COOLDOWN - elapsedSeconds;
        return NextResponse.json(
          {
            error: `Please wait ${remaining} seconds before requesting a new verification code.`,
            retryAfter: remaining,
          },
          { status: 429 }
        );
      }
    }

    // Rate limiting: Maximum 5 OTPs per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpsCount = await prisma.otpCode.count({
      where: {
        userId: user.id,
        type: 'PHONE',
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtpsCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum hourly verification limit reached (5 requests/hour). Please try again later.' },
        { status: 429 }
      );
    }

    // If phone number was changed, update on user record (and mpesaNumber if not verified yet)
    if (normalizedPhone !== user.phone) {
      // Check if another user already has this phone verified
      const duplicateUser = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
          id: { not: user.id },
          phoneVerified: true,
        },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'This phone number is already verified on another account.' },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone: normalizedPhone,
          mpesaNumber: normalizedPhone,
          phoneVerified: false,
        },
      });
    }

    // Invalidate previous active OTPs
    await prisma.otpCode.updateMany({
      where: { userId: user.id, type: 'PHONE', isUsed: false },
      data: { isUsed: true },
    });

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: 'PHONE',
        expiresAt,
      },
    });

    // Dispatch SMS
    const smsResult = await sendSmsOtp(normalizedPhone, otpCode);

    return NextResponse.json({
      success: true,
      message: `OTP verification code sent to ${formatKenyanPhoneDisplay(normalizedPhone)}.`,
      phone: normalizedPhone,
      cooldownSeconds: 60,
      provider: smsResult.provider,
      // Provide demo code in non-production for frictionless testing
      demoCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 400 });
  }
}
