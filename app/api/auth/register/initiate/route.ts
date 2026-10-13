import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { normalizeKenyanPhone, isSafaricomNumber } from '@/lib/phone';
import { sendEmailOtp } from '@/lib/email';
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
        { error: 'Please enter a valid Kenyan Safaricom phone number (e.g. 07XXXXXXXX or 01XXXXXXXX).' },
        { status: 400 }
      );
    }

    const resolvedMpesa = normalizeKenyanPhone(mpesaNumber?.trim() || phone.trim());
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicates in the live User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
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
          { email: normalizedEmail },
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
          email: normalizedEmail,
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
        email: normalizedEmail,
        phone: normalizedPhone,
        mpesaNumber: resolvedMpesa,
        passwordHash,
        referralCode: validatedReferralCode,
        checkoutRequestId: `OTP:${otpCode}:${expiresAtMs}`,
        status: 'PENDING_OTP',
      },
    });

    // Send OTP via Email (Gmail SMTP)
    const emailResult = await sendEmailOtp(normalizedEmail, otpCode, 'REGISTRATION', fullName.trim());

    if (!emailResult.success && process.env.EMAIL_USER) {
      console.error(`[REGISTER OTP EMAIL FAILED] To: ${normalizedEmail}, Error: ${emailResult.error}`);
      // Clean up the pending record since email failed
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      return NextResponse.json(
        {
          error: `Failed to send verification email to ${normalizedEmail}. ${emailResult.error || 'Please try again or contact support.'}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      step: 'otp',
      pendingId: pending.id,
      email: normalizedEmail,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox (and spam folder).`,
      emailProvider: emailResult.provider,
      demoCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error('Register initiate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate registration' }, { status: 500 });
  }
}
