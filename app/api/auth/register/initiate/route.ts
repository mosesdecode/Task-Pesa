import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { normalizeKenyanPhone, isSafaricomNumber } from '@/lib/phone';
import { sendSmsOtp } from '@/lib/sms';
import { validateReferralEligibility } from '@/lib/antifraud';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, username, email, phone, mpesaNumber, password, referralCode } = body;

    if (!fullName || !username || !email || !phone || !password) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedPhone = normalizeKenyanPhone(phone);
    if (!isSafaricomNumber(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid Kenyan Safaricom phone number (e.g. 07XXXXXXXX or 011XXXXXXX).' },
        { status: 400 }
      );
    }

    const resolvedMpesa = normalizeKenyanPhone(mpesaNumber?.trim() || phone.trim());

    // Check duplicates in the live User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { phone: normalizedPhone },
          { username: username.trim().toLowerCase() },
        ],
      },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email, username, or phone number already exists.' },
        { status: 400 }
      );
    }

    // Check duplicates in the pending table and remove stale records
    const existingPending = await prisma.pendingRegistration.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { phone: normalizedPhone },
          { username: username.trim().toLowerCase() },
        ],
      },
    });
    if (existingPending) {
      await prisma.pendingRegistration.delete({ where: { id: existingPending.id } });
    }

    // Anti-fraud referral check
    let validatedReferralCode: string | null = null;
    if (referralCode?.trim()) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });
      if (referrer) {
        const antiFraud = await validateReferralEligibility(referrer.id, {
          phone: normalizedPhone,
          mpesaNumber: resolvedMpesa,
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
        });
        if (antiFraud.allowed) {
          validatedReferralCode = referralCode.trim();
        }
      }
    }

    const passwordHash = await hashPassword(password);

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    // Save to PendingRegistration with OTP embedded in checkoutRequestId
    const pending = await prisma.pendingRegistration.create({
      data: {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        mpesaNumber: resolvedMpesa,
        passwordHash,
        referralCode: validatedReferralCode,
        checkoutRequestId: `OTP:${otpCode}:${expiresAtMs}`,
        status: 'PENDING_OTP',
      },
    });

    // Send OTP via Africa's Talking SMS
    const smsResult = await sendSmsOtp(normalizedPhone, otpCode, 'REGISTRATION');

    return NextResponse.json({
      success: true,
      step: 'otp',
      pendingId: pending.id,
      phone: normalizedPhone,
      message: `A 6-digit verification code has been sent to ${normalizedPhone}.`,
      smsProvider: smsResult.provider,
      demoCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('Register initiate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate registration' }, { status: 500 });
  }
}
