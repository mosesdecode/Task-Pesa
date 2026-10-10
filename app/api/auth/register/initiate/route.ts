import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { getDarajaAccessToken, formatKenyanPhone } from '@/lib/mpesa';
import { validateReferralEligibility } from '@/lib/antifraud';

const ACTIVATION_FEE = 200;

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

    const resolvedMpesa = (mpesaNumber?.trim() || phone.trim());

    // Check duplicates in the live User table
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }, { username }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email, username, or phone number already exists.' },
        { status: 400 }
      );
    }

    // Check duplicates in the pending table
    const existingPending = await prisma.pendingRegistration.findFirst({
      where: { OR: [{ email }, { phone }, { username }] },
    });
    if (existingPending) {
      // Allow them to re-initiate by deleting stale pending record
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
          phone,
          mpesaNumber: resolvedMpesa,
          email,
          username,
        });
        if (antiFraud.allowed) {
          validatedReferralCode = referralCode.trim();
        }
      }
    }

    const passwordHash = await hashPassword(password);

    // Save to PendingRegistration
    const pending = await prisma.pendingRegistration.create({
      data: {
        fullName,
        username,
        email,
        phone,
        mpesaNumber: resolvedMpesa,
        passwordHash,
        referralCode: validatedReferralCode,
        status: 'PENDING_PAYMENT',
      },
    });

    // Trigger STK Push
    const formattedPhone = formatKenyanPhone(resolvedMpesa);
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'http://localhost:3000/api/mpesa/callback';

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);

    const password64 = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const checkoutRequestId = `ws_CO_REG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const token = await getDarajaAccessToken();

    // Update pending record with checkoutRequestId
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { checkoutRequestId },
    });

    if (token === 'MOCK_DARAJA_ACCESS_TOKEN') {
      return NextResponse.json({
        success: true,
        pendingId: pending.id,
        checkoutRequestId,
        isSimulation: true,
        message: `STK Push sent to ${formattedPhone}. Enter your M-Pesa PIN to pay KES ${ACTIVATION_FEE} and complete registration.`,
      });
    }

    const env = process.env.MPESA_ENVIRONMENT || 'sandbox';
    const stkUrl =
      env === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const response = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password64,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: ACTIVATION_FEE,
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `TASKMINT_REG_${username.substring(0, 6).toUpperCase()}`,
        TransactionDesc: 'TaskMint Account Activation Fee',
      }),
    });

    const resData = await response.json();

    const realCheckoutId = resData.CheckoutRequestID || checkoutRequestId;
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { checkoutRequestId: realCheckoutId },
    });

    if (resData.ResponseCode !== '0') {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: resData.errorMessage || 'M-Pesa request failed. Please check your phone number and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      pendingId: pending.id,
      checkoutRequestId: realCheckoutId,
      isSimulation: false,
      message: resData.CustomerMessage || `STK Push sent to your phone. Enter your M-Pesa PIN to pay KES ${ACTIVATION_FEE}.`,
    });
  } catch (error: any) {
    console.error('Register initiate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate registration payment' }, { status: 500 });
  }
}
