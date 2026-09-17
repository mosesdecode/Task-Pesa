import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackTransaction, processPaystackSuccess } from '@/lib/paystack';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/paystack/verify?reference=PSK_xxxx
 *
 * Called after Paystack redirects the user back to your site.
 * Verifies the payment and processes activation / package upgrade.
 * Returns JSON so the client can decide where to navigate.
 */
export async function GET(req: NextRequest) {
  try {
    // requireAuth can fail if the session cookie expired during redirect — handle gracefully
    let userId: string | null = null;
    try {
      const user = await requireAuth(req);
      userId = user.id;
    } catch {
      // Will still process via webhook; return success to frontend
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    // Verify with Paystack
    const verification = await verifyPaystackTransaction(reference);

    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: 'Payment not successful', status: verification.status },
        { status: 400 }
      );
    }

    // Process success (idempotent — safe to call even if webhook already did it)
    const result = await processPaystackSuccess(reference, reference);

    // If redirected by Paystack in a browser, send user to dashboard
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/html')) {
      return NextResponse.redirect(new URL('/dashboard?activated=true', req.url));
    }

    return NextResponse.json({
      success: true,
      reference,
      amount: verification.amount,
      channel: verification.channel,
      paidAt: verification.paidAt,
      result,
    });
  } catch (error: any) {
    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
