import { prisma } from './prisma';
import { processActivationSuccess } from './activation';

export interface StkPushParams {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  userId: string;
  type: 'ACTIVATION' | 'PACKAGE';
}

export async function getDarajaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';

  if (!consumerKey || consumerKey.includes('mock') || consumerKey.includes('here')) {
    return 'MOCK_DARAJA_ACCESS_TOKEN';
  }

  const env = process.env.MPESA_ENVIRONMENT || 'sandbox';
  const url =
    env === 'production'
      ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
    });
    const data = await res.json();
    return data.access_token || 'MOCK_DARAJA_ACCESS_TOKEN';
  } catch (error) {
    console.error('Failed to obtain Daraja access token:', error);
    return 'MOCK_DARAJA_ACCESS_TOKEN';
  }
}

export function formatKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

export async function initiateStkPush(params: StkPushParams) {
  const formattedPhone = formatKenyanPhone(params.phoneNumber);
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  const callbackUrl = process.env.MPESA_CALLBACK_URL || 'http://localhost:3000/api/mpesa/callback';

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const merchantRequestId = `REQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Store pending Deposit record in DB
  const deposit = await prisma.deposit.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      phone: formattedPhone,
      status: 'PENDING',
      checkoutRequestId,
      merchantRequestId,
      type: params.type,
    },
  });

  const token = await getDarajaAccessToken();

  if (token === 'MOCK_DARAJA_ACCESS_TOKEN') {
    // Return structured simulated Daraja STK Push response
    return {
      success: true,
      checkoutRequestId,
      merchantRequestId,
      depositId: deposit.id,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: `STK Push sent to ${formattedPhone}. Enter your M-Pesa PIN to complete payment of KES ${params.amount}.`,
      isSimulation: true,
    };
  }

  const env = process.env.MPESA_ENVIRONMENT || 'sandbox';
  const stkUrl =
    env === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  try {
    const response = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(params.amount),
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: params.accountReference,
        TransactionDesc: params.transactionDesc,
      }),
    });

    const resData = await response.json();
    return {
      success: resData.ResponseCode === '0',
      checkoutRequestId: resData.CheckoutRequestID || checkoutRequestId,
      merchantRequestId: resData.MerchantRequestID || merchantRequestId,
      depositId: deposit.id,
      ResponseCode: resData.ResponseCode,
      ResponseDescription: resData.ResponseDescription,
      CustomerMessage: resData.CustomerMessage || 'STK Push sent successfully.',
      isSimulation: false,
    };
  } catch (err: any) {
    console.error('STK Push API Call error:', err);
    return {
      success: false,
      error: err.message,
      checkoutRequestId,
      depositId: deposit.id,
    };
  }
}

export async function processPaymentSuccess(checkoutRequestId: string, mpesaReceipt: string) {
  const deposit = await prisma.deposit.findUnique({
    where: { checkoutRequestId },
  });

  if (!deposit || deposit.status === 'COMPLETED') {
    return { success: false, message: 'Deposit already processed or not found' };
  }

  if (deposit.type === 'ACTIVATION') {
    return await processActivationSuccess({
      checkoutRequestId,
      depositId: deposit.id,
      mpesaReceipt,
      amount: deposit.amount,
      channel: 'MPESA',
    });
  }

  return await prisma.$transaction(async (tx) => {
    // Update deposit status
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'COMPLETED',
        mpesaReceipt,
      },
    });

    const user = await tx.user.findUnique({
      where: { id: deposit.userId },
      include: { wallet: true },
    });

    if (!user) return { success: false, message: 'User not found' };
      // Find package matching price
      const matchingPackage = await tx.membershipPackage.findFirst({
        where: { price: deposit.amount },
      });

      if (matchingPackage) {
        const expiresAt = new Date(Date.now() + matchingPackage.durationDays * 24 * 60 * 60 * 1000);

        await tx.user.update({
          where: { id: user.id },
          data: { packageId: matchingPackage.id, packageExpiresAt: expiresAt },
        });

        await tx.userPackage.create({
          data: {
            userId: user.id,
            packageId: matchingPackage.id,
            expiresAt,
            status: 'ACTIVE',
            paymentReceipt: mpesaReceipt,
          },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: `Upgraded to ${matchingPackage.name}! 🌟`,
            message: `Your ${matchingPackage.name} tier is now active for ${matchingPackage.durationDays} days. Enjoy higher task limits!`,
            type: 'SUCCESS',
          },
        });

        if (user.wallet) {
          await tx.walletTransaction.create({
            data: {
              walletId: user.wallet.id,
              userId: user.id,
              amount: deposit.amount,
              type: 'PACKAGE_PURCHASE',
              status: 'COMPLETED',
              description: `Package upgrade to ${matchingPackage.name} (Receipt: ${mpesaReceipt})`,
              referenceId: mpesaReceipt,
            },
          });
        }
      }

    return { success: true, depositId: deposit.id };
  }, {
    maxWait: 15000,
    timeout: 30000,
  });
}
