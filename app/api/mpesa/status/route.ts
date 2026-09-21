import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');
    const depositId = searchParams.get('depositId');

    if (!checkoutRequestId && !depositId) {
      return NextResponse.json({ error: 'checkoutRequestId or depositId is required' }, { status: 400 });
    }

    const deposit = await prisma.deposit.findFirst({
      where: {
        userId: user.id,
        OR: [
          checkoutRequestId ? { checkoutRequestId } : {},
          depositId ? { id: depositId } : {},
        ],
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    // Refresh user state to verify if active
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { status: true, packageId: true },
    });

    return NextResponse.json({
      status: deposit.status,
      isCompleted: deposit.status === 'COMPLETED',
      mpesaReceipt: deposit.mpesaReceipt,
      userStatus: freshUser?.status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check status' }, { status: 500 });
  }
}
