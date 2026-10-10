import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { getDarajaAccessToken, formatKenyanPhone } from '@/lib/mpesa';
import { initializePaystackTransaction, generatePaystackReference } from '@/lib/paystack';
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

    // Generate Paystack reference
    const reference = generatePaystackReference('REG');

    // Update pending record with the generated reference (acts as checkoutRequestId)
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { checkoutRequestId: reference },
    });

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const appUrl = process.env.APP_URL && !process.env.APP_URL.includes('localhost')
      ? process.env.APP_URL
      : host
        ? `${proto}://${host}`
        : 'http://localhost:3000';
    
    // We will redirect them back to a verification page, or just status polling
    const callbackUrl = `${appUrl}/api/paystack/verify?reference=${reference}&type=REGISTRATION`;

    const result = await initializePaystackTransaction({
      email,
      amount: ACTIVATION_FEE,
      reference,
      callbackUrl,
      userId: pending.id, // we pass pending id since user id doesn't exist yet
      type: 'ACTIVATION',
      phone: resolvedMpesa,
      metadata: {
        username,
        fullName,
        isRegistration: true,
      },
    });

    if (!result.success || !result.authorizationUrl) {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } });
      return NextResponse.json({ error: 'Failed to initialize payment gateway' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      pendingId: pending.id,
      checkoutRequestId: reference,
      authorizationUrl: result.authorizationUrl, // the frontend will redirect here
      isSimulation: false,
      message: 'Redirecting to payment gateway...',
    });
  } catch (error: any) {
    console.error('Register initiate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate registration payment' }, { status: 500 });
  }
}
