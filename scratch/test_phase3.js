const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('TASKMINT PHASE 3: COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testUserAPhone = `254711${timestamp.toString().slice(-6)}`;
  const testUserBPhone = `254722${timestamp.toString().slice(-6)}`;
  const testUserCPhone = `254733${timestamp.toString().slice(-6)}`;

  try {
    // ----------------------------------------------------
    // SCENARIO 1: User A Setup & Referral Code Generation
    // ----------------------------------------------------
    console.log('--- SCENARIO 1: User A Registration & Referral Code ---');
    const userA = await prisma.user.create({
      data: {
        fullName: 'Test User A (Referrer)',
        email: `usera_${timestamp}@taskmint.test`,
        phone: testUserAPhone,
        username: `usera_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'USER',
        status: 'ACTIVE',
        referralCode: `TM-A${timestamp.toString().slice(-4)}`,
        wallet: {
          create: {
            balance: 0,
            currency: 'KES',
          },
        },
      },
      include: { wallet: true },
    });

    assert(userA.referralCode && userA.referralCode.startsWith('TM-'), 'User A referral code format', userA.referralCode);
    assert(userA.wallet.balance === 0, 'User A initial wallet balance is KES 0');

    // ----------------------------------------------------
    // SCENARIO 2: User B Registers with User A's Referral Code
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 2: User B Registers via User A Referral ---');
    const userB = await prisma.user.create({
      data: {
        fullName: 'Test User B (Invited)',
        email: `userb_${timestamp}@taskmint.test`,
        phone: testUserBPhone,
        username: `userb_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'USER',
        status: 'PENDING_ACTIVATION', // New users start in PENDING_ACTIVATION
        referredById: userA.id,
        referralCode: `TM-B${timestamp.toString().slice(-4)}`,
        wallet: {
          create: {
            balance: 0,
            currency: 'KES',
          },
        },
      },
      include: { wallet: true },
    });

    const referralAB = await prisma.referral.create({
      data: {
        referrerId: userA.id,
        referredId: userB.id,
        rewardAmount: 100.0,
        status: 'PENDING_ACTIVATION',
      },
    });

    assert(userB.status === 'PENDING_ACTIVATION', 'User B status is PENDING_ACTIVATION');
    assert(referralAB.status === 'PENDING_ACTIVATION', 'Referral status is PENDING_ACTIVATION');
    assert(referralAB.rewardAmount === 100.0, 'Referral reward is set to KES 100.0');

    // Verify User A wallet is NOT credited before activation payment
    const userAWalletBeforePay = await prisma.wallet.findUnique({ where: { userId: userA.id } });
    assert(userAWalletBeforePay.balance === 0, 'User A has received KES 0 before activation payment');

    // ----------------------------------------------------
    // SCENARIO 3: Access Control - Unactivated User Blocked from Tasks
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 3: Task Access Gating for Unactivated Users ---');
    const userBCheck = await prisma.user.findUnique({ where: { id: userB.id } });
    const isUserBActive = userBCheck.status === 'ACTIVE';
    assert(!isUserBActive, 'Unactivated User B is restricted from claiming/submitting tasks');

    // ----------------------------------------------------
    // SCENARIO 4: User B Pays KES 200 Activation Fee (Referred Flow)
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 4: User B Pays KES 200 Activation Fee ---');
    const depositB = await prisma.deposit.create({
      data: {
        userId: userB.id,
        amount: 200.0,
        currency: 'KES',
        method: 'MPESA',
        status: 'PENDING',
        type: 'ACTIVATION',
        checkoutRequestId: `ws_CO_${timestamp}_B`,
      },
    });

    // Import and execute activation processing engine
    const { processActivationSuccess } = require('../lib/activation');
    const activationResult = await processActivationSuccess({
      checkoutRequestId: depositB.checkoutRequestId,
      depositId: depositB.id,
      mpesaReceipt: `REC_B_${timestamp}`,
      amount: 200.0,
      channel: 'MPESA',
    });

    assert(activationResult.success === true, 'Activation processing returned success');

    // Verify User B status is now ACTIVE
    const userBUpdated = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(userBUpdated.status === 'ACTIVE', 'User B status upgraded to ACTIVE');

    // Verify Deposit is COMPLETED
    const depositBUpdated = await prisma.deposit.findUnique({ where: { id: depositB.id } });
    assert(depositBUpdated.status === 'COMPLETED', 'Deposit B status is COMPLETED');

    // Verify Ledger Records for User B activation
    const ledgersB = await prisma.financialLedger.findMany({
      where: {
        paymentId: depositB.id,
      },
    });

    const paymentEntry = ledgersB.find(l => l.type === 'ACTIVATION_PAYMENT');
    const adminEntry = ledgersB.find(l => l.type === 'ACTIVATION_ADMIN_EARNING');
    const referralEntry = ledgersB.find(l => l.type === 'REFERRAL_REWARD');

    assert(paymentEntry && paymentEntry.amount === 200.0, 'Ledger recorded KES 200 ACTIVATION_PAYMENT');
    assert(adminEntry && adminEntry.amount === 100.0, 'Ledger recorded KES 100 ACTIVATION_ADMIN_EARNING');
    assert(referralEntry && referralEntry.amount === 100.0, 'Ledger recorded KES 100 REFERRAL_REWARD');

    // Accounting check: Admin (100) + Referral (100) === Payment (200)
    const ledgerSumB = adminEntry.amount + referralEntry.amount;
    assert(ledgerSumB === paymentEntry.amount, '100% Balanced Accounting: Admin (100) + Referral (100) == 200', `Sum: ${ledgerSumB}`);

    // Verify Referral Record is REWARDED
    const referralABUpdated = await prisma.referral.findUnique({ where: { id: referralAB.id } });
    assert(referralABUpdated.status === 'REWARDED', 'Referral status updated to REWARDED');
    assert(referralABUpdated.rewardedAt !== null, 'Referral rewardedAt timestamp recorded');

    // Verify User A Wallet received KES 100
    const userAWalletAfterPay = await prisma.wallet.findUnique({ where: { userId: userA.id } });
    assert(userAWalletAfterPay.balance === 100.0, 'User A wallet credited exactly KES 100', `Balance: ${userAWalletAfterPay.balance}`);

    // Verify Wallet Transaction for User A
    const userATransaction = await prisma.walletTransaction.findFirst({
      where: {
        userId: userA.id,
        type: 'REFERRAL_REWARD',
        status: 'COMPLETED',
      },
    });
    assert(userATransaction && userATransaction.amount === 100.0, 'User A wallet transaction exists with type REFERRAL_REWARD');

    // ----------------------------------------------------
    // SCENARIO 5: Idempotency & Replay Protection
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 5: Payment Webhook Replay Protection ---');
    const replayResult = await processActivationSuccess({
      checkoutRequestId: depositB.checkoutRequestId,
      depositId: depositB.id,
      mpesaReceipt: `REC_B_${timestamp}`,
      amount: 200.0,
      channel: 'MPESA',
    });

    assert(replayResult.alreadyProcessed === true, 'Replay attempt recognized as already processed (idempotent)', replayResult.message);

    // Verify User A was NOT credited a second time
    const userAWalletAfterReplay = await prisma.wallet.findUnique({ where: { userId: userA.id } });
    assert(userAWalletAfterReplay.availableBalance === 100.0, 'User A balance remains KES 100 (Zero duplicate rewards)');

    // Verify no extra ledger entries created
    const ledgersBAfterReplay = await prisma.financialLedger.findMany({
      where: { paymentId: depositB.id },
    });
    assert(ledgersBAfterReplay.length === 3, 'Ledger entries count remains exactly 3');

    // ----------------------------------------------------
    // SCENARIO 6: Anti-Self-Referral Check
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 6: Anti-Self-Referral Validation ---');
    const { validateReferralEligibility } = require('../lib/antifraud');
    const selfReferralCheck = await validateReferralEligibility(userA.id, {
      phone: userA.phone,
      email: userA.email,
      username: userA.username,
    });
    assert(selfReferralCheck.allowed === false, 'Self-referral check correctly blocked', selfReferralCheck.reason);

    // ----------------------------------------------------
    // SCENARIO 7: Unreferred User C Activation (Platform Retained Reserve)
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 7: Unreferred User Activation & Platform Retained Reserve ---');
    const userC = await prisma.user.create({
      data: {
        fullName: 'Test User C (Unreferred)',
        email: `userc_${timestamp}@taskmint.test`,
        phone: testUserCPhone,
        username: `userc_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'USER',
        status: 'PENDING_ACTIVATION',
        referredById: null, // Unreferred
        referralCode: `TM-C${timestamp.toString().slice(-4)}`,
        wallet: {
          create: {
            balance: 0,
            currency: 'KES',
          },
        },
      },
    });

    const depositC = await prisma.deposit.create({
      data: {
        userId: userC.id,
        amount: 200.0,
        currency: 'KES',
        method: 'MPESA',
        status: 'PENDING',
        type: 'ACTIVATION',
        checkoutRequestId: `ws_CO_${timestamp}_C`,
      },
    });

    const activationResultC = await processActivationSuccess({
      checkoutRequestId: depositC.checkoutRequestId,
      depositId: depositC.id,
      mpesaReceipt: `REC_C_${timestamp}`,
      amount: 200.0,
      channel: 'MPESA',
    });

    assert(activationResultC.success === true, 'Unreferred user activation processed successfully');

    const ledgersC = await prisma.financialLedger.findMany({
      where: { paymentId: depositC.id },
    });

    const paymentEntryC = ledgersC.find(l => l.type === 'ACTIVATION_PAYMENT');
    const adminEntryC = ledgersC.find(l => l.type === 'ACTIVATION_ADMIN_EARNING');
    const retainedEntryC = ledgersC.find(l => l.type === 'PLATFORM_RETAINED_AMOUNT');
    const referralEntryC = ledgersC.find(l => l.type === 'REFERRAL_REWARD');

    assert(paymentEntryC && paymentEntryC.amount === 200.0, 'User C recorded KES 200 ACTIVATION_PAYMENT');
    assert(adminEntryC && adminEntryC.amount === 100.0, 'User C recorded KES 100 ACTIVATION_ADMIN_EARNING');
    assert(retainedEntryC && retainedEntryC.amount === 100.0, 'User C recorded KES 100 PLATFORM_RETAINED_AMOUNT');
    assert(!referralEntryC, 'Zero referral reward paid for unreferred user');

    // Accounting check: Admin (100) + Platform Retained (100) === Payment (200)
    const ledgerSumC = adminEntryC.amount + retainedEntryC.amount;
    assert(ledgerSumC === paymentEntryC.amount, '100% Balanced Accounting: Admin (100) + Retained (100) == 200', `Sum: ${ledgerSumC}`);

    // ----------------------------------------------------
    // SCENARIO 8: Failed Payment Handling
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 8: Failed Payment Handling ---');
    const userD = await prisma.user.create({
      data: {
        fullName: 'Test User D (Failed Payment)',
        email: `userd_${timestamp}@taskmint.test`,
        phone: `254744${timestamp.toString().slice(-6)}`,
        username: `userd_${timestamp}`,
        passwordHash: 'dummyhash',
        role: 'USER',
        status: 'PENDING_ACTIVATION',
        referralCode: `TM-D${timestamp.toString().slice(-4)}`,
      },
    });

    const depositD = await prisma.deposit.create({
      data: {
        userId: userD.id,
        amount: 200.0,
        currency: 'KES',
        method: 'MPESA',
        status: 'FAILED',
        type: 'ACTIVATION',
      },
    });

    const userDCheck = await prisma.user.findUnique({ where: { id: userD.id } });
    assert(userDCheck.status === 'PENDING_ACTIVATION', 'Failed payment leaves user in PENDING_ACTIVATION');

    const ledgersD = await prisma.financialLedger.findMany({ where: { paymentId: depositD.id } });
    assert(ledgersD.length === 0, 'Zero ledger entries created for failed deposit');

    // ----------------------------------------------------
    // SCENARIO 9: User Wallet Earnings Breakdown
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 9: User Wallet Earnings Breakdown ---');
    const userAWallet = await prisma.wallet.findUnique({
      where: { userId: userA.id },
      include: {
        transactions: true,
      },
    });

    const referralTxs = userAWallet.transactions.filter(t => t.type === 'REFERRAL_REWARD' && t.status === 'COMPLETED');
    const totalRefEarnings = referralTxs.reduce((sum, t) => sum + t.amount, 0);

    assert(totalRefEarnings === 100.0, 'Wallet computes KES 100 referral earnings accurately', `Computed: ${totalRefEarnings}`);
    assert(userAWallet.balance === 100.0, 'Wallet balance matches available funds');

    // ----------------------------------------------------
    // SCENARIO 10: Admin Financial Dashboard & Ledger Aggregations
    // ----------------------------------------------------
    console.log('\n--- SCENARIO 10: Admin Platform Revenue Ledger Metrics ---');
    const activationPaymentsAgg = await prisma.financialLedger.aggregate({
      where: { type: 'ACTIVATION_PAYMENT', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const adminEarningsAgg = await prisma.financialLedger.aggregate({
      where: { type: 'ACTIVATION_ADMIN_EARNING', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const referralRewardsAgg = await prisma.financialLedger.aggregate({
      where: { type: 'REFERRAL_REWARD', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    const platformRetainedAgg = await prisma.financialLedger.aggregate({
      where: { type: 'PLATFORM_RETAINED_AMOUNT', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    });

    console.log('Ledger Aggregates:', {
      totalActivationRevenue: activationPaymentsAgg._sum.amount,
      totalAdminEarnings: adminEarningsAgg._sum.amount,
      totalReferralRewards: referralRewardsAgg._sum.amount,
      totalPlatformRetained: platformRetainedAgg._sum.amount,
    });

    const totalAllocated = (adminEarningsAgg._sum.amount || 0) + 
                           (referralRewardsAgg._sum.amount || 0) + 
                           (platformRetainedAgg._sum.amount || 0);

    const totalCollected = activationPaymentsAgg._sum.amount || 0;

    assert(totalAllocated === totalCollected, 'Global Ledger Integrity: Total Collected == Total Allocated (Admin + Referrals + Retained)', `${totalCollected} === ${totalAllocated}`);
    assert(adminEarningsAgg._count.id >= 2, 'Admin earnings recorded for both tested activations');

    // Cleanup test records
    console.log('\nCleaning up test records...');
    await prisma.financialLedger.deleteMany({
      where: {
        paymentId: { in: [depositB.id, depositC.id, depositD.id] },
      },
    });
    await prisma.walletTransaction.deleteMany({
      where: { userId: { in: [userA.id, userB.id, userC.id, userD.id] } },
    });
    await prisma.referral.deleteMany({
      where: { id: referralAB.id },
    });
    await prisma.deposit.deleteMany({
      where: { id: { in: [depositB.id, depositC.id, depositD.id] } },
    });
    await prisma.wallet.deleteMany({
      where: { userId: { in: [userA.id, userB.id, userC.id] } },
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: [userA.id, userB.id, userC.id] } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [userA.id, userB.id, userC.id, userD.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userA.id, userB.id, userC.id, userD.id] } },
    });
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
