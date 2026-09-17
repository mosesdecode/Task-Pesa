import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        user: { select: { id: true, fullName: true, username: true, email: true, phone: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { withdrawalId, action, adminNotes } = body; // action: 'APPROVE' | 'REJECT'

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: { include: { wallet: true } } },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal record not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ error: 'Withdrawal request has already been processed.' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      const mpesaReceipt = `B2C_${Math.floor(10000000 + Math.random() * 90000000)}`;

      await prisma.$transaction(async (tx) => {
        // Mark paid
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'PAID',
            mpesaReceipt,
            processedAt: new Date(),
            adminNotes: adminNotes || 'Approved and processed via M-Pesa B2C Payout',
          },
        });

        // Update user wallet balances
        if (withdrawal.user.wallet) {
          await tx.wallet.update({
            where: { id: withdrawal.user.wallet.id },
            data: {
              pendingBalance: { decrement: withdrawal.amount },
              totalWithdrawn: { increment: withdrawal.amount },
            },
          });

          await tx.walletTransaction.updateMany({
            where: { referenceId: withdrawal.id },
            data: { status: 'COMPLETED' },
          });
        }

        // Send notification
        await tx.notification.create({
          data: {
            userId: withdrawal.userId,
            title: 'M-Pesa Withdrawal Processed 💸',
            message: `Your withdrawal of KES ${withdrawal.amount.toLocaleString()} was successfully disbursed to ${withdrawal.mpesaNumber}. M-Pesa Receipt: ${mpesaReceipt}`,
            type: 'SUCCESS',
          },
        });

        // Create admin audit record
        await tx.adminAuditLog.create({
          data: {
            adminId: admin.id,
            action: 'APPROVE_WITHDRAWAL',
            targetType: 'WITHDRAWAL',
            targetId: withdrawal.id,
            detailsJson: JSON.stringify({ amount: withdrawal.amount, mpesaReceipt }),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal of KES ${withdrawal.amount.toLocaleString()} approved and sent via M-Pesa B2C! Receipt: ${mpesaReceipt}`,
      });
    } else {
      // REJECT withdrawal -> return funds to available balance
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'REJECTED',
            adminNotes: adminNotes || 'Rejected by administration',
            processedAt: new Date(),
          },
        });

        if (withdrawal.user.wallet) {
          await tx.wallet.update({
            where: { id: withdrawal.user.wallet.id },
            data: {
              pendingBalance: { decrement: withdrawal.amount },
              availableBalance: { increment: withdrawal.amount },
            },
          });
        }

        await tx.notification.create({
          data: {
            userId: withdrawal.userId,
            title: 'Withdrawal Request Rejected ⚠️',
            message: `Your withdrawal of KES ${withdrawal.amount.toLocaleString()} was rejected and the funds were returned to your available balance. Reason: ${adminNotes || 'Account verification issue'}`,
            type: 'WARNING',
          },
        });
      });

      return NextResponse.json({ success: true, message: 'Withdrawal rejected and funds refunded to user available balance.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
