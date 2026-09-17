import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { processPaymentSuccess } from '@/lib/mpesa';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Simulation is disabled in production.' }, { status: 403 });
  }

  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { checkoutRequestId, depositId } = body;

    let targetCheckoutId = checkoutRequestId;

    if (!targetCheckoutId && depositId) {
      const deposit = await prisma.deposit.findUnique({ where: { id: depositId } });
      if (deposit) targetCheckoutId = deposit.checkoutRequestId;
    }

    if (!targetCheckoutId) {
      // Find latest pending deposit for user
      const latestPending = await prisma.deposit.findFirst({
        where: { userId: user.id, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
      if (latestPending?.checkoutRequestId) {
        targetCheckoutId = latestPending.checkoutRequestId;
      }
    }

    if (!targetCheckoutId) {
      // Create instant deposit record if none exists
      const mockCheckoutId = `SIM_${Date.now()}`;
      await prisma.deposit.create({
        data: {
          userId: user.id,
          amount: 200,
          phone: user.mpesaNumber,
          status: 'PENDING',
          checkoutRequestId: mockCheckoutId,
          type: 'ACTIVATION',
        },
      });
      targetCheckoutId = mockCheckoutId;
    }

    const receipt = `QK${Math.floor(100000 + Math.random() * 900000)}KES`;
    const result = await processPaymentSuccess(targetCheckoutId, receipt);

    return NextResponse.json({
      success: true,
      message: 'M-Pesa payment simulated and verified successfully!',
      mpesaReceipt: receipt,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Simulation error' }, { status: 400 });
  }
}
