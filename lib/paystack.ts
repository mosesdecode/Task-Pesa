import { prisma } from './prisma';
import { processActivationSuccess } from './activation';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitPaystackParams {
  email: string;
  amount: number; // in KES (will be converted to kobo/cents for API)
  reference: string;
  callbackUrl: string;
  userId: string;
  type: 'ACTIVATION' | 'PACKAGE';
  phone?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  depositId: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  reference: string;
  amount: number;
  status: string;
  gatewayResponse?: string;
  paidAt?: string;
  channel?: string;
  currency?: string;
  customer?: { email: string; phone?: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY || '';
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured');
  return key;
}

/** Convert KES to smallest currency unit (Paystack uses KES cents × 100) */
function toKobo(kes: number): number {
  return Math.round(kes * 100);
}

// ─── Initialize Payment ───────────────────────────────────────────────────────

export async function initializePaystackTransaction(
  params: InitPaystackParams
): Promise<PaystackInitResponse> {
  const secretKey = getPaystackSecretKey();

  // Create a pending Deposit record first
  const deposit = await prisma.deposit.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      phone: params.phone || '',
      status: 'PENDING',
      checkoutRequestId: params.reference,
      merchantRequestId: `PSK_${Date.now()}`,
      type: params.type,
    },
  });

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: toKobo(params.amount),
        reference: params.reference,
        callback_url: params.callbackUrl,
        currency: 'KES',
        channels: ['mobile_money', 'card', 'bank', 'ussd'],
        metadata: {
          userId: params.userId,
          type: params.type,
          depositId: deposit.id,
          ...(params.metadata || {}),
        },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
      depositId: deposit.id,
    };
  } catch (error: any) {
    // Mark deposit as failed if initialization fails
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: 'FAILED' },
    }).catch(() => null);

    console.error('Paystack initialization error:', error);
    return {
      success: false,
      reference: params.reference,
      depositId: deposit.id,
      error: error.message,
    };
  }
}

// ─── Verify Transaction ───────────────────────────────────────────────────────

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const secretKey = getPaystackSecretKey();

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || 'Paystack verification failed');
  }

  const txn = data.data;

  return {
    success: txn.status === 'success',
    reference: txn.reference,
    amount: txn.amount / 100, // convert back from kobo
    status: txn.status,
    gatewayResponse: txn.gateway_response,
    paidAt: txn.paid_at,
    channel: txn.channel,
    currency: txn.currency,
    customer: {
      email: txn.customer?.email,
      phone: txn.customer?.phone,
    },
  };
}

// ─── Verify Webhook Signature ─────────────────────────────────────────────────

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
  if (!secretKey) return false;

  // Node.js crypto (available in Next.js server runtime)
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

// ─── Process Payment Success ──────────────────────────────────────────────────

export async function processPaystackSuccess(
  reference: string,
  paystackId: string
) {
  const deposit = await prisma.deposit.findUnique({
    where: { checkoutRequestId: reference },
  });

  if (!deposit || deposit.status === 'COMPLETED') {
    return { success: false, message: 'Deposit already processed or not found' };
  }

  if (deposit.type === 'ACTIVATION') {
    return await processActivationSuccess({
      checkoutRequestId: reference,
      depositId: deposit.id,
      mpesaReceipt: paystackId,
      amount: deposit.amount,
      channel: 'PAYSTACK',
    });
  }

  return await prisma.$transaction(async (tx) => {
    // Mark deposit as completed
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'COMPLETED',
        mpesaReceipt: paystackId, // reusing field for Paystack transaction ID
      },
    });

    const user = await tx.user.findUnique({
      where: { id: deposit.userId },
      include: { wallet: true },
    });

    if (!user) return { success: false, message: 'User not found' };

    if (deposit.type === 'PACKAGE') {
      // Package payments are handled separately in the purchase route
      // This just confirms the payment
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Package Payment Confirmed! 🌟',
          message: `Your payment of KES ${deposit.amount} was confirmed via Paystack (Ref: ${paystackId}).`,
          type: 'SUCCESS',
        },
      });
    }

    return { success: true, depositId: deposit.id };
  }, { maxWait: 15000, timeout: 30000 });
}

// ─── Generate Unique Payment Reference ───────────────────────────────────────

export function generatePaystackReference(prefix = 'PSK'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}_${timestamp}_${random}`;
}
