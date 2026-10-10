import { prisma } from './prisma';
import { getFinancialConfig } from './config';

export interface ProcessActivationParams {
  checkoutRequestId?: string;
  depositId?: string;
  mpesaReceipt: string;
  amount?: number;
  channel?: 'MPESA' | 'PAYSTACK' | 'MANUAL';
  rawPayload?: any;
}

export interface ActivationResult {
  success: boolean;
  alreadyProcessed?: boolean;
  depositId?: string;
  userId?: string;
  message?: string;
  adminEarningKES?: number;
  referralRewardKES?: number;
  platformRetainedKES?: number;
}

/**
 * Authoritative Activation Payment & Accounting Processor.
 *
 * Implements:
 * 1. Strict Idempotency (replay protection)
 * 2. User Activation (PENDING_ACTIVATION -> ACTIVE)
 * 3. KES 100 Admin Activation Earning recorded in FinancialLedger
 * 4. KES 100 Referral Reward credited to Referrer Wallet & Ledger (if referred)
 * 5. KES 100 Platform Retained Amount recorded in Ledger (if unreferred)
 * 6. Audit logs & user notifications
 */
export async function processActivationSuccess(
  params: ProcessActivationParams
): Promise<ActivationResult> {
  const { checkoutRequestId, depositId, mpesaReceipt, channel = 'MPESA' } = params;

  if (!checkoutRequestId && !depositId) {
    return { success: false, message: 'Missing payment identifiers (checkoutRequestId or depositId).' };
  }

  // Fetch financial parameters from database
  const config = await getFinancialConfig();
  const adminEarningAmount = config.adminActivationEarningKES; // 100 KES
  const referralRewardAmount = config.referralRewardKES; // 100 KES

  // Pre-transaction check to avoid unnecessary transaction overhead on fast double-calls
  const existingDeposit = await prisma.deposit.findFirst({
    where: {
      OR: [
        checkoutRequestId ? { checkoutRequestId } : undefined,
        depositId ? { id: depositId } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!existingDeposit) {
    return { success: false, message: 'Deposit record not found.' };
  }

  if (existingDeposit.status === 'COMPLETED') {
    return {
      success: true,
      alreadyProcessed: true,
      depositId: existingDeposit.id,
      userId: existingDeposit.userId,
      message: 'Payment has already been processed and account activated.',
    };
  }

  return await prisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction lock & double-check status
      const deposit = await tx.deposit.findUnique({
        where: { id: existingDeposit.id },
      });

      if (!deposit || deposit.status === 'COMPLETED') {
        return {
          success: true,
          alreadyProcessed: true,
          depositId: deposit?.id,
          userId: deposit?.userId,
          message: 'Payment has already been processed and account activated.',
        };
      }

      const paymentAmount = deposit.amount || config.activationFeeKES; // e.g. 200 KES
      const receiptNumber = mpesaReceipt || `REC_${Date.now()}`;

      // 2. Mark Deposit as COMPLETED
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'COMPLETED',
          mpesaReceipt: receiptNumber,
        },
      });

      // 3. Find User & Ensure Wallet exists
      const user = await tx.user.findUnique({
        where: { id: deposit.userId },
        include: { wallet: true },
      });

      if (!user) {
        throw new Error(`Activating user ${deposit.userId} not found.`);
      }

      // Ensure user has a wallet
      let userWallet = user.wallet;
      if (!userWallet) {
        userWallet = await tx.wallet.create({
          data: {
            userId: user.id,
            availableBalance: 0,
            pendingBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
          },
        });
      }

      // 4. Activate User Account
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          isVerified: true,
        },
      });

      // 5. Record User Payment in User Wallet Transactions (as a payment fee, NOT user income)
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          userId: user.id,
          amount: paymentAmount,
          type: 'ACTIVATION_FEE',
          status: 'COMPLETED',
          description: `Account activation payment (Receipt: ${receiptNumber})`,
          referenceId: receiptNumber,
        },
      });

      // 6. Record Input Payment in Central Financial Ledger
      await tx.financialLedger.create({
        data: {
          userId: user.id,
          type: 'ACTIVATION_PAYMENT',
          amount: paymentAmount,
          currency: 'KES',
          status: 'COMPLETED',
          reference: receiptNumber,
          source: channel === 'MPESA' ? 'MPESA_STK' : channel,
          paymentId: deposit.id,
          metadataJson: JSON.stringify({
            username: user.username,
            phone: user.phone,
            channel,
          }),
        },
      });

      // 7. Record Admin Activation Earning in Central Financial Ledger (KES 100)
      await tx.financialLedger.create({
        data: {
          userId: user.id, // the activating user who generated the earning
          type: 'ACTIVATION_ADMIN_EARNING',
          amount: adminEarningAmount,
          currency: 'KES',
          status: 'COMPLETED',
          reference: receiptNumber,
          source: 'ACTIVATION_PAYMENT',
          paymentId: deposit.id,
          metadataJson: JSON.stringify({
            activatingUserId: user.id,
            activatingUsername: user.username,
            amountKES: adminEarningAmount,
          }),
        },
      });

      let referralRewarded = false;
      let referrerUserId: string | null = null;

      // 8. Referral Reward Allocation (KES 100)
      if (user.referredById && user.referredById !== user.id) {
        const referral = await tx.referral.findUnique({
          where: { referredUserId: user.id },
        });

        // Ensure referral exists and has not already been rewarded
        if (referral && referral.status !== 'REWARDED') {
          const referrer = await tx.user.findUnique({
            where: { id: user.referredById },
            include: { wallet: true },
          });

          // Anti-abuse check: ensure referrer exists and is not banned/suspended
          if (referrer && !referrer.isBanned && referrer.status !== 'SUSPENDED') {
            let referrerWallet = referrer.wallet;
            if (!referrerWallet) {
              referrerWallet = await tx.wallet.create({
                data: {
                  userId: referrer.id,
                  availableBalance: 0,
                  pendingBalance: 0,
                  totalEarned: 0,
                  totalWithdrawn: 0,
                },
              });
            }

            // Update Referral record status to REWARDED
            await tx.referral.update({
              where: { id: referral.id },
              data: {
                status: 'REWARDED',
                rewardAmount: referralRewardAmount,
                qualifiedAt: new Date(),
                rewardedAt: new Date(),
              },
            });

            // Credit Referrer's Wallet
            await tx.wallet.update({
              where: { id: referrerWallet.id },
              data: {
                availableBalance: { increment: referralRewardAmount },
                totalEarned: { increment: referralRewardAmount },
              },
            });

            // Record in Referrer's Wallet Transactions
            await tx.walletTransaction.create({
              data: {
                walletId: referrerWallet.id,
                userId: referrer.id,
                amount: referralRewardAmount,
                type: 'REFERRAL_REWARD',
                status: 'COMPLETED',
                description: `Referral reward for ${user.username}'s confirmed activation`,
                referenceId: referral.id,
              },
            });

            // Record in Central Financial Ledger
            await tx.financialLedger.create({
              data: {
                userId: referrer.id,
                type: 'REFERRAL_REWARD',
                amount: referralRewardAmount,
                currency: 'KES',
                status: 'COMPLETED',
                reference: receiptNumber,
                source: 'ACTIVATION_PAYMENT',
                paymentId: deposit.id,
                referralId: referral.id,
                metadataJson: JSON.stringify({
                  referrerId: referrer.id,
                  referrerUsername: referrer.username,
                  referredUserId: user.id,
                  referredUsername: user.username,
                }),
              },
            });

            // Send Notification to Referrer
            await tx.notification.create({
              data: {
                userId: referrer.id,
                title: 'Referral Reward Credited! 💰',
                message: `You received a KES ${referralRewardAmount.toFixed(2)} referral reward because ${user.fullName || user.username} activated their account!`,
                type: 'SUCCESS',
              },
            });

            referralRewarded = true;
            referrerUserId = referrer.id;
          }
        }
      }

      // 9. If NOT referred (or referral was ineligible): Account for remaining KES 100 in Ledger (Requirement 24)
      let platformRetainedKES = 0;
      if (!referralRewarded) {
        platformRetainedKES = paymentAmount - adminEarningAmount; // e.g. 200 - 100 = 100 KES
        if (platformRetainedKES > 0) {
          await tx.financialLedger.create({
            data: {
              userId: user.id,
              type: 'PLATFORM_RETAINED_AMOUNT',
              amount: platformRetainedKES,
              currency: 'KES',
              status: 'COMPLETED',
              reference: receiptNumber,
              source: 'ACTIVATION_PAYMENT',
              paymentId: deposit.id,
              metadataJson: JSON.stringify({
                reason: 'Unreferred activation: remaining balance retained in platform reserves',
                activatingUserId: user.id,
                totalPaid: paymentAmount,
                adminEarning: adminEarningAmount,
                retainedAmount: platformRetainedKES,
              }),
            },
          });
        }
      }

      // 10. Send Confirmation Notification to Activating User
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Account Activated! 🎉',
          message: `Your KES ${paymentAmount} activation fee has been confirmed (${receiptNumber}). Your TaskMint account is now fully active and you have unlimited access to digital tasks!`,
          type: 'SUCCESS',
        },
      });

      // 11. System Audit Log
      await tx.adminAuditLog.create({
        data: {
          adminId: user.id, // target user context
          action: 'CONFIRM_ACTIVATION_PAYMENT',
          targetType: 'USER_ACTIVATION',
          targetId: user.id,
          detailsJson: JSON.stringify({
            depositId: deposit.id,
            receiptNumber,
            channel,
            paymentAmount,
            adminEarningAmount,
            referralRewardAmount: referralRewarded ? referralRewardAmount : 0,
            platformRetainedKES,
            referrerUserId,
          }),
        },
      });

      return {
        success: true,
        depositId: deposit.id,
        userId: user.id,
        adminEarningKES: adminEarningAmount,
        referralRewardKES: referralRewarded ? referralRewardAmount : 0,
        platformRetainedKES,
        message: 'Account activation completed successfully.',
      };
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );
}

/**
 * Completes registration from a PendingRegistration record when M-Pesa payment arrives.
 * Called from the M-Pesa callback when checkoutRequestId matches a PendingRegistration.
 */
export async function completePendingRegistration(
  checkoutRequestId: string,
  mpesaReceipt: string
): Promise<{ success: boolean; userId?: string; message?: string }> {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { checkoutRequestId },
  });

  if (!pending) return { success: false, message: 'No pending registration found for this payment.' };
  if (pending.status === 'COMPLETED') return { success: false, message: 'Registration already completed.' };

  const config = await getFinancialConfig();
  const paymentAmount = config.activationFeeKES;
  const adminEarningAmount = config.adminActivationEarningKES;
  const referralRewardAmount = config.referralRewardKES;

  // Duplicate safety check
  const duplicate = await prisma.user.findFirst({
    where: { OR: [{ email: pending.email }, { phone: pending.phone }, { username: pending.username }] },
  });
  if (duplicate) {
    await prisma.pendingRegistration.update({ where: { id: pending.id }, data: { status: 'COMPLETED' } });
    return { success: false, message: 'An account with these details already exists.' };
  }

  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const userReferralCode = `TM-${pending.username.substring(0, 4).toUpperCase()}${randomSuffix}`;

  const defaultPackage = await prisma.membershipPackage.findFirst({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });

  let referrerId: string | null = null;
  if (pending.referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: pending.referralCode } });
    if (referrer && !referrer.isBanned && referrer.status !== 'SUSPENDED') {
      referrerId = referrer.id;
    }
  }

  return await prisma.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: pending.fullName,
          username: pending.username,
          email: pending.email,
          phone: pending.phone,
          mpesaNumber: pending.mpesaNumber,
          passwordHash: pending.passwordHash,
          referralCode: userReferralCode,
          referredById: referrerId,
          packageId: defaultPackage?.id,
          status: 'ACTIVE',
          isVerified: true,
          wallet: {
            create: { availableBalance: 0.0, pendingBalance: 0.0, totalEarned: 0.0, totalWithdrawn: 0.0 },
          },
        },
        include: { wallet: true },
      });

      const userWalletId = user.wallet!.id;

      const deposit = await tx.deposit.create({
        data: {
          userId: user.id,
          amount: paymentAmount,
          phone: pending.mpesaNumber,
          status: 'COMPLETED',
          checkoutRequestId,
          mpesaReceipt,
          type: 'ACTIVATION',
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: userWalletId,
          userId: user.id,
          amount: paymentAmount,
          type: 'ACTIVATION_FEE',
          status: 'COMPLETED',
          description: `Account activation payment (Receipt: ${mpesaReceipt})`,
          referenceId: mpesaReceipt,
        },
      });

      await tx.financialLedger.create({
        data: {
          userId: user.id,
          type: 'ACTIVATION_PAYMENT',
          amount: paymentAmount,
          currency: 'KES',
          status: 'COMPLETED',
          reference: mpesaReceipt,
          source: 'MPESA_STK',
          paymentId: deposit.id,
          metadataJson: JSON.stringify({ username: user.username, phone: user.phone }),
        },
      });

      await tx.financialLedger.create({
        data: {
          userId: user.id,
          type: 'ACTIVATION_ADMIN_EARNING',
          amount: adminEarningAmount,
          currency: 'KES',
          status: 'COMPLETED',
          reference: mpesaReceipt,
          source: 'ACTIVATION_PAYMENT',
          paymentId: deposit.id,
          metadataJson: JSON.stringify({ activatingUserId: user.id, activatingUsername: user.username }),
        },
      });

      let referralRewarded = false;
      if (referrerId) {
        const referrer = await tx.user.findUnique({ where: { id: referrerId }, include: { wallet: true } });
        if (referrer && !referrer.isBanned) {
          let referrerWallet = referrer.wallet;
          if (!referrerWallet) {
            referrerWallet = await tx.wallet.create({
              data: { userId: referrer.id, availableBalance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0 },
            });
          }
          const refRecord = await tx.referral.create({
            data: {
              referrerId,
              referredUserId: user.id,
              rewardAmount: referralRewardAmount,
              status: 'REWARDED',
              qualifiedAt: new Date(),
              rewardedAt: new Date(),
            },
          });
          await tx.wallet.update({
            where: { id: referrerWallet.id },
            data: { availableBalance: { increment: referralRewardAmount }, totalEarned: { increment: referralRewardAmount } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: referrerWallet.id,
              userId: referrer.id,
              amount: referralRewardAmount,
              type: 'REFERRAL_REWARD',
              status: 'COMPLETED',
              description: `Referral reward for ${user.username}'s activation`,
              referenceId: refRecord.id,
            },
          });
          await tx.financialLedger.create({
            data: {
              userId: referrer.id,
              type: 'REFERRAL_REWARD',
              amount: referralRewardAmount,
              currency: 'KES',
              status: 'COMPLETED',
              reference: mpesaReceipt,
              source: 'ACTIVATION_PAYMENT',
              paymentId: deposit.id,
              referralId: refRecord.id,
              metadataJson: JSON.stringify({ referrerId: referrer.id, referredUserId: user.id }),
            },
          });
          await tx.notification.create({
            data: {
              userId: referrer.id,
              title: 'Referral Reward Credited! 💰',
              message: `You received KES ${referralRewardAmount} because ${user.fullName || user.username} activated their account!`,
              type: 'SUCCESS',
            },
          });
          referralRewarded = true;
        }
      }

      if (!referralRewarded) {
        const platformRetained = paymentAmount - adminEarningAmount;
        if (platformRetained > 0) {
          await tx.financialLedger.create({
            data: {
              userId: user.id,
              type: 'PLATFORM_RETAINED_AMOUNT',
              amount: platformRetained,
              currency: 'KES',
              status: 'COMPLETED',
              reference: mpesaReceipt,
              source: 'ACTIVATION_PAYMENT',
              paymentId: deposit.id,
              metadataJson: JSON.stringify({ reason: 'Unreferred activation' }),
            },
          });
        }
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Account Activated! 🎉',
          message: `Your KES ${paymentAmount} activation fee has been confirmed (${mpesaReceipt}). Welcome to TaskMint — start earning today!`,
          type: 'SUCCESS',
        },
      });

      await tx.pendingRegistration.update({
        where: { id: pending.id },
        data: { status: 'COMPLETED' },
      });

      return { success: true, userId: user.id, message: 'Registration completed. Account is now active.' };
    },
    { maxWait: 15000, timeout: 30000 }
  );
}
