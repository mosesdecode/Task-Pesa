import { prisma } from './prisma';

export async function getUserWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        availableBalance: 0.0,
        pendingBalance: 0.0,
        totalEarned: 0.0,
        totalWithdrawn: 0.0,
      },
    });
  }

  return wallet;
}

export async function creditTaskReward(userId: string, amount: number, taskTitle: string, referenceId: string) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
        totalEarned: { increment: amount },
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        amount,
        type: 'TASK_REWARD',
        status: 'COMPLETED',
        description: `Task Reward: ${taskTitle}`,
        referenceId,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Task Approved! 💵',
        message: `Your task "${taskTitle}" was approved and KES ${amount.toFixed(2)} was credited to your wallet.`,
        type: 'SUCCESS',
      },
    });

    return updatedWallet;
  }, { maxWait: 15000, timeout: 30000 });
}

export async function requestWithdrawal(userId: string, mpesaNumber: string, amount: number) {
  const MIN_WITHDRAWAL = 2500.0;

  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal amount is KES ${MIN_WITHDRAWAL.toLocaleString()}`);
  }

  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.availableBalance < amount) {
      throw new Error(`Insufficient available balance. You have KES ${wallet.availableBalance.toFixed(2)} available.`);
    }

    // Deduct available balance and add to pending balance / withdrawal record
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });

    const withdrawal = await tx.withdrawal.create({
      data: {
        userId,
        mpesaNumber,
        amount,
        status: 'PENDING',
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        amount: -amount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: `Withdrawal request of KES ${amount.toLocaleString()} to ${mpesaNumber}`,
        referenceId: withdrawal.id,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Withdrawal Requested ⏳',
        message: `Your withdrawal request of KES ${amount.toLocaleString()} is currently under review for Friday payout processing.`,
        type: 'INFO',
      },
    });

    return withdrawal;
  }, { maxWait: 15000, timeout: 30000 });
}

export async function adminAdjustBalance(
  adminId: string,
  targetUserId: string,
  amount: number,
  reason: string
) {
  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: targetUserId } });
    if (!wallet) throw new Error('User wallet not found');

    const isCredit = amount >= 0;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
        totalEarned: isCredit ? { increment: amount } : undefined,
      },
    });

    const txRecord = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: targetUserId,
        amount,
        type: 'ADMIN_ADJUSTMENT',
        status: 'COMPLETED',
        description: `Admin Balance Adjustment: ${reason}`,
      },
    });

    // Create immutable audit log
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'ADJUST_BALANCE',
        targetType: 'USER_WALLET',
        targetId: targetUserId,
        detailsJson: JSON.stringify({ amount, reason, transactionId: txRecord.id }),
      },
    });

    await tx.notification.create({
      data: {
        userId: targetUserId,
        title: 'Balance Adjustment',
        message: `Your account balance was adjusted by KES ${amount > 0 ? '+' : ''}${amount.toFixed(2)}. Reason: ${reason}`,
        type: 'INFO',
      },
    });

    return txRecord;
  }, { maxWait: 15000, timeout: 30000 });
}
