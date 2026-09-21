import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { initializePaystackTransaction, generatePaystackReference } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { amount, type, phone } = body; // type: 'ACTIVATION' | 'PACKAGE'

    const targetAmount = amount || 200;
    const paymentType = type || 'ACTIVATION';
    const reference = generatePaystackReference(paymentType === 'ACTIVATION' ? 'ACT' : 'PKG');

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const appUrl = process.env.APP_URL && !process.env.APP_URL.includes('localhost')
      ? process.env.APP_URL
      : host
        ? `${proto}://${host}`
        : 'http://localhost:3000';
    const callbackUrl = `${appUrl}/api/paystack/verify?reference=${reference}`;

    const result = await initializePaystackTransaction({
      email: user.email,
      amount: targetAmount,
      reference,
      callbackUrl,
      userId: user.id,
      type: paymentType,
      phone: phone || user.mpesaNumber,
      metadata: {
        username: user.username,
        fullName: user.fullName,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Paystack initialize error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Paystack payment' },
      { status: 400 }
    );
  }
}
