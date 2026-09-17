import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { initiateStkPush } from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { phone, amount, type } = body; // type: 'ACTIVATION' | 'PACKAGE'

    const targetPhone = phone || user.mpesaNumber;
    const targetAmount = amount || 200;

    const result = await initiateStkPush({
      phoneNumber: targetPhone,
      amount: targetAmount,
      accountReference: `TASKPESA_${user.username}`,
      transactionDesc: type === 'ACTIVATION' ? 'TaskPesa Access Fee' : 'Membership Upgrade',
      userId: user.id,
      type: type || 'ACTIVATION',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('STK Push API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to initiate M-Pesa payment' }, { status: 400 });
  }
}
