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
  });
}

export async function getWithdrawalEligibility(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      taskSubmissions: { where: { status: 'APPROVED' } },
      referralsGiven: { where: { status: 'QUALIFIED' } },
      adViews: { where: { rewarded: true } },
      whatsappSubmissions: { where: { status: 'APPROVED' } },
    },
  });

  if (!user) throw new Error('User not found');

  const now = new Date();
  const accountAgeMs = now.getTime() - new Date(user.createdAt).getTime();
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));
  const completedTasksCount = user.taskSubmissions.length;
  const activeReferralsCount = user.referralsGiven.length;

  // Calculate non-referral earnings
  const taskEarnings = user.taskSubmissions.length * 15; // approximate or task based
  const adEarnings = user.adViews.length * 5;
  const whatsappEarnings = user.whatsappSubmissions.length * 20;
  const nonReferralEarningsEstimate = taskEarnings + adEarnings + whatsappEarnings;

  // Check 48 hour rate limit
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const recentWithdrawal = await prisma.withdrawal.findFirst({
    where: {
      userId,
      requestedAt: { gte: fortyEightHoursAgo },
    },
    orderBy: { requestedAt: 'desc' },
  });

  const isWithinRateLimit = !recentWithdrawal;

  // Referral ratio check: available balance must not be 100% from referrals if user has zero completed tasks/ads/whatsapp work
  const hasNonReferralWork = completedTasksCount > 0 || user.adViews.length > 0 || user.whatsappSubmissions.length > 0;

  const checks = {
    minTasks: { met: completedTasksCount >= 10, current: completedTasksCount, target: 10 },
    accountAge: { met: accountAgeDays >= 5, current: accountAgeDays, target: 5 },
    activeReferrals: { met: activeReferralsCount >= 5, current: activeReferralsCount, target: 5 },
    nonReferralBalance: { met: hasNonReferralWork, message: 'Must have earnings from completed tasks/ads/promotions' },
    phoneVerified: { met: user.phoneVerified, message: 'Phone number verified via OTP' },
    rateLimit: { met: isWithinRateLimit, nextAllowedAt: recentWithdrawal ? new Date(recentWithdrawal.requestedAt.getTime() + 48 * 60 * 60 * 1000) : null },
  };

  const isEligible =
    checks.minTasks.met &&
    checks.accountAge.met &&
    checks.activeReferrals.met &&
    checks.nonReferralBalance.met &&
    checks.phoneVerified.met &&
    checks.rateLimit.met;

  return {
    isEligible,
    checks,
    userPhone: user.phone,
    phoneVerified: user.phoneVerified,
  };
}

export async function requestWithdrawal(userId: string, mpesaNumber: string, amount: number) {
  const MIN_WITHDRAWAL = 500.0;
  const WITHDRAWAL_FEE = 10.0;

  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal amount is KES ${MIN_WITHDRAWAL.toLocaleString()}`);
  }

  const eligibility = await getWithdrawalEligibility(userId);
  if (!eligibility.isEligible) {
    if (!eligibility.checks.phoneVerified.met) {
      throw new Error('Please verify your Safaricom phone number via OTP before requesting a withdrawal.');
    }
    if (!eligibility.checks.rateLimit.met) {
      throw new Error('Withdrawal limit reached: You can only make 1 withdrawal request every 48 hours.');
    }
    if (!eligibility.checks.minTasks.met) {
      throw new Error(`Requirement not met: You must complete at least 10 approved tasks (Current: ${eligibility.checks.minTasks.current}/10).`);
    }
    if (!eligibility.checks.accountAge.met) {
      throw new Error(`Requirement not met: Account must be at least 5 days old (Current: ${eligibility.checks.accountAge.current}/5 days).`);
    }
    if (!eligibility.checks.activeReferrals.met) {
      throw new Error(`Requirement not met: You must have at least 5 active referrals (Current: ${eligibility.checks.activeReferrals.current}/5).`);
    }
    if (!eligibility.checks.nonReferralBalance.met) {
      throw new Error('Requirement not met: Account balance cannot be 100% from referrals. Complete tasks to qualify.');
    }
  }

  return await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.availableBalance < amount) {
      throw new Error(`Insufficient available balance. You have KES ${wallet.availableBalance.toFixed(2)} available.`);
    }

    // Deduct available balance and add to pending balance
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
        fee: WITHDRAWAL_FEE,
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
        description: `Withdrawal request of KES ${amount.toLocaleString()} to ${mpesaNumber} (Fee: KES ${WITHDRAWAL_FEE})`,
        referenceId: withdrawal.id,
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Withdrawal Requested ⏳',
        message: `Your withdrawal request of KES ${amount.toLocaleString()} (Fee: KES ${WITHDRAWAL_FEE}) is pending admin review & manual payout.`,
        type: 'INFO',
      },
    });

    return withdrawal;
  });
}

export async function approveWithdrawal(adminId: string, withdrawalId: string, mpesaReceipt?: string, adminNotes?: string) {
  return await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal || withdrawal.status !== 'PENDING') {
      throw new Error('Withdrawal request not found or not pending');
    }

    const wallet = await tx.wallet.findUnique({ where: { userId: withdrawal.userId } });
    if (!wallet) throw new Error('User wallet not found');

    // Update wallet: decrement pending balance and increment total withdrawn
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { decrement: withdrawal.amount },
        totalWithdrawn: { increment: withdrawal.amount },
      },
    });

    // Mark withdrawal as PAID
    const updatedWithdrawal = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'PAID',
        mpesaReceipt: mpesaReceipt || `MANUAL_${Date.now()}`,
        adminNotes,
        processedAt: new Date(),
      },
    });

    // Update pending wallet transaction status to COMPLETED
    await tx.walletTransaction.updateMany({
      where: { referenceId: withdrawalId },
      data: { status: 'COMPLETED' },
    });

    // Log admin audit
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'APPROVE_WITHDRAWAL',
        targetType: 'WITHDRAWAL',
        targetId: withdrawalId,
        detailsJson: JSON.stringify({ amount: withdrawal.amount, mpesaReceipt, adminNotes }),
      },
    });

    // Notify user
    await tx.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Payout Processed Successfully! 🎉',
        message: `Your withdrawal of KES ${withdrawal.amount.toLocaleString()} has been manually paid out by Admin. Receipt: ${mpesaReceipt || 'Paid'}`,
        type: 'SUCCESS',
      },
    });

    return updatedWithdrawal;
  });
}

export async function rejectWithdrawal(adminId: string, withdrawalId: string, reason: string) {
  return await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal || withdrawal.status !== 'PENDING') {
      throw new Error('Withdrawal request not found or not pending');
    }

    const wallet = await tx.wallet.findUnique({ where: { userId: withdrawal.userId } });
    if (!wallet) throw new Error('User wallet not found');

    // Restore pending balance back to available balance
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { decrement: withdrawal.amount },
        availableBalance: { increment: withdrawal.amount },
      },
    });

    // Mark withdrawal as REJECTED
    const updatedWithdrawal = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'REJECTED',
        adminNotes: reason,
        processedAt: new Date(),
      },
    });

    // Update wallet transaction status to CANCELLED
    await tx.walletTransaction.updateMany({
      where: { referenceId: withdrawalId },
      data: { status: 'CANCELLED' },
    });

    // Log admin audit
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'REJECT_WITHDRAWAL',
        targetType: 'WITHDRAWAL',
        targetId: withdrawalId,
        detailsJson: JSON.stringify({ amount: withdrawal.amount, reason }),
      },
    });

    // Notify user
    await tx.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Request Rejected ❌',
        message: `Your withdrawal request of KES ${withdrawal.amount.toLocaleString()} was rejected. Reason: ${reason}. KES ${withdrawal.amount.toLocaleString()} has been returned to your available balance.`,
        type: 'WARNING',
      },
    });

    return updatedWithdrawal;
  });
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
  });
}

