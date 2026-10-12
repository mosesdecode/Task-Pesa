import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initializePaystackTransaction, generatePaystackReference } from '@/lib/paystack';
import { sendEmailOtp } from '@/lib/email';

const ACTIVATION_FEE = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pendingId, code, resend } = body;

    if (!pendingId) {
      return NextResponse.json({ error: 'Pending registration ID is required' }, { status: 400 });
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });

    if (!pending) {
      return NextResponse.json(
        { error: 'Pending registration record not found or expired. Please sign up again.' },
        { status: 404 }
      );
    }

    // ── Resend Flow ──
    if (resend) {
      const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAtMs = Date.now() + 10 * 60 * 1000;

      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: {
          checkoutRequestId: `OTP:${newOtpCode}:${expiresAtMs}`,
          status: 'PENDING_OTP',
        },
      });

      const emailResult = await sendEmailOtp(pending.email, newOtpCode, 'REGISTRATION');

      if (!emailResult.success && process.env.EMAIL_USER) {
        console.error(`[REGISTER RESEND OTP FAILED] To: ${pending.email}, Error: ${emailResult.error}`);
        return NextResponse.json(
          {
            error: `Failed to resend verification code to ${pending.email}. ${emailResult.error || 'Please try again later.'}`,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `A new 6-digit verification code was sent to ${pending.email}.`,
        emailProvider: emailResult.provider,
        demoCode: process.env.NODE_ENV !== 'production' ? newOtpCode : undefined,
      });
    }

    // ── Verify Code Flow ──
    if (!code || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Please enter the 6-digit verification code' }, { status: 400 });
    }

    if (!pending.checkoutRequestId || !pending.checkoutRequestId.startsWith('OTP:')) {
      return NextResponse.json(
        { error: 'No active OTP verification found. Please request a new code.' },
        { status: 400 }
      );
    }

    const parts = pending.checkoutRequestId.split(':');
    const storedCode = parts[1];
    const expiresAtMs = parseInt(parts[2], 10);

    if (Date.now() > expiresAtMs) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (storedCode !== code.trim()) {
      return NextResponse.json(
        { error: 'Incorrect verification code. Please check your SMS and try again.' },
        { status: 400 }
      );
    }

    // Phone verified! Now generate Paystack reference and initialize KES 200 activation
    const reference = generatePaystackReference('REG');

    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: {
        checkoutRequestId: reference,
        status: 'PENDING_PAYMENT',
      },
    });

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const appUrl = process.env.APP_URL && !process.env.APP_URL.includes('localhost')
      ? process.env.APP_URL
      : host
        ? `${proto}://${host}`
        : 'http://localhost:3000';

    const callbackUrl = `${appUrl}/api/paystack/verify?reference=${reference}&type=REGISTRATION`;

    const paystackResult = await initializePaystackTransaction({
      email: pending.email,
      amount: ACTIVATION_FEE,
      reference,
      callbackUrl,
      userId: pending.id,
      type: 'ACTIVATION',
      phone: pending.mpesaNumber || pending.phone,
      metadata: {
        username: pending.username,
        fullName: pending.fullName,
        isRegistration: true,
      },
    });

    if (!paystackResult.success || !paystackResult.authorizationUrl) {
      return NextResponse.json(
        { error: 'Failed to initialize Paystack payment gateway. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pendingId: pending.id,
      reference,
      authorizationUrl: paystackResult.authorizationUrl,
      message: 'Email verified! Redirecting to Paystack for KES 200 activation payment...',
    });
  } catch (error: any) {
    console.error('Verify registration OTP error:', error);
    return NextResponse.json({ error: error.message || 'OTP verification failed' }, { status: 500 });
  }
}
