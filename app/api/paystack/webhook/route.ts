import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPaystackWebhookSignature,
  verifyPaystackTransaction,
  processPaystackSuccess,
} from '@/lib/paystack';

// Paystack sends webhooks for all events; we only care about charge.success
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // 1. Verify the webhook signature
    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      console.warn('⚠️  Invalid Paystack webhook signature rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log('📦 Paystack Webhook Event:', event.event, event.data?.reference);

    // 2. Handle charge.success
    if (event.event === 'charge.success') {
      const { reference, status } = event.data;

      if (status !== 'success') {
        return NextResponse.json({ received: true });
      }

      // 3. Re-verify with Paystack API to avoid replay attacks
      const verification = await verifyPaystackTransaction(reference);

      if (!verification.success) {
        console.error('Payment verification failed for reference:', reference);
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      // 4. Process business logic (activate account, credit referral, etc.)
      const result = await processPaystackSuccess(reference, reference);
      console.log('✅ Paystack payment processed:', reference, result);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Paystack webhook handler error:', error);
    // Always return 200 to Paystack to prevent retries for unrecoverable errors
    return NextResponse.json({ received: true });
  }
}
