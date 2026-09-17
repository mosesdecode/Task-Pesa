import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processPaymentSuccess } from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📱 Safaricom M-Pesa Callback Payload:', JSON.stringify(body, null, 2));

    const stkCallback = body.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' }, { status: 400 });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    // Log raw transaction record
    await prisma.mpesaTransaction.create({
      data: {
        checkoutRequestId,
        merchantRequestId: stkCallback.MerchantRequestID,
        resultCode,
        resultDesc: stkCallback.ResultDesc,
        amount: 0,
        phoneNumber: '',
        rawPayload: JSON.stringify(body),
      },
    }).catch(() => null);

    if (resultCode === 0) {
      // Payment Successful
      const callbackItems = stkCallback.CallbackMetadata?.Item || [];
      let mpesaReceipt = `NL${Date.now()}`;
      
      for (const item of callbackItems) {
        if (item.Name === 'MpesaReceiptNumber') {
          mpesaReceipt = item.Value;
        }
      }

      await processPaymentSuccess(checkoutRequestId, mpesaReceipt);
    } else {
      // Mark deposit failed
      await prisma.deposit.updateMany({
        where: { checkoutRequestId },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error: any) {
    console.error('M-Pesa Callback handler error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal callback processing error' }, { status: 500 });
  }
}
