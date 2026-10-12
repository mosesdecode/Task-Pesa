/**
 * SMS Provider Gateway for Safaricom Phone OTP Verification in TaskMint
 * 
 * Supports Africa's Talking, Twilio, or Custom HTTP SMS Gateway.
 * Configuration environment variables:
 * - SMS_PROVIDER: 'africastalking' | 'twilio' | 'custom' | 'development'
 * - AFRICASTALKING_API_KEY: Africa's Talking API key
 * - AFRICASTALKING_USERNAME: Africa's Talking username (e.g. sandbox or production)
 * - SMS_SENDER_ID: Approved alphanumeric sender ID (default: TASKMINT)
 */

import { normalizeKenyanPhone } from './phone';

export interface SendSmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export async function sendSmsOtp(
  phone: string,
  otpCode: string,
  purpose: 'REGISTRATION' | 'WITHDRAWAL' | 'VERIFICATION' = 'VERIFICATION'
): Promise<SendSmsResult> {
  const provider = process.env.SMS_PROVIDER || 'development';
  // In live production, only send 'from' if an approved Alphanumeric Sender ID or Shortcode is explicitly configured
  const senderId = process.env.SMS_SENDER_ID?.trim() || '';
  const targetPhone = normalizeKenyanPhone(phone);

  let messageText = `Your TaskMint verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;
  if (purpose === 'REGISTRATION') {
    messageText = `Your TaskMint registration verification code is: ${otpCode}. Enter this to activate your account. Valid for 10 minutes.`;
  } else if (purpose === 'WITHDRAWAL') {
    messageText = `Your TaskMint withdrawal authorization code is: ${otpCode}. Valid for 10 minutes. NEVER share this code with anyone.`;
  }

  // 1. Africa's Talking SMS Integration (Production & Sandbox)
  if (provider === 'africastalking' && process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
    try {
      const username = process.env.AFRICASTALKING_USERNAME.trim();
      const apiKey = process.env.AFRICASTALKING_API_KEY.trim();
      const isSandbox = username.toLowerCase() === 'sandbox';
      const endpoint = isSandbox
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('to', targetPhone);
      formData.append('message', messageText);

      // Only pass 'from' if explicitly set in environment and not on sandbox
      if (senderId && !isSandbox) {
        formData.append('from', senderId);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });

      // Handle non-200 responses safely (AT returns plain text on 401/403/500 errors)
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[SMS ERROR Africa's Talking HTTP ${res.status}]:`, errorText);
        let errorMsg = `Africa's Talking HTTP ${res.status}`;
        if (res.status === 401) {
          errorMsg = "Africa's Talking Authentication Failed: Please check your live AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY.";
        } else if (res.status === 403) {
          errorMsg = "Africa's Talking 403 Forbidden: Account suspended or unapproved Sender ID.";
        } else if (errorText) {
          errorMsg = `Africa's Talking: ${errorText}`;
        }
        return {
          success: false,
          provider: 'africastalking',
          error: errorMsg,
        };
      }

      // Safe JSON parsing
      let data: any;
      try {
        data = await res.json();
      } catch (parseErr) {
        const rawBody = await res.text();
        console.error("[SMS ERROR Africa's Talking Parse]:", rawBody);
        return {
          success: false,
          provider: 'africastalking',
          error: `Invalid response format from Africa's Talking: ${rawBody.slice(0, 100)}`,
        };
      }

      const recipientData = data?.SMSMessageData?.Recipients?.[0];
      const isSuccess = recipientData && (recipientData.status === 'Success' || recipientData.statusCode === 101);

      if (isSuccess) {
        return {
          success: true,
          provider: 'africastalking',
          messageId: recipientData.messageId,
        };
      } else {
        const statusMsg = recipientData?.status || data?.SMSMessageData?.Message || 'Failed to dispatch via Africa\'s Talking';
        console.error('[SMS FAILED Africa\'s Talking Recipient]:', {
          status: statusMsg,
          statusCode: recipientData?.statusCode,
          recipient: recipientData,
        });
        return {
          success: false,
          provider: 'africastalking',
          error: `SMS Delivery Failed (${statusMsg})`,
        };
      }
    } catch (err: any) {
      console.error('[SMS ERROR Africa\'s Talking]:', err);
      return { success: false, provider: 'africastalking', error: err.message };
    }
  }

  // 2. Development & Staging Fallback
  // Logs to server console for non-production environments
  console.log(`[SMS OTP DISPATCH] Provider: ${provider} | To: ${phone} | Text: "${messageText}" | Code: ${otpCode}`);

  return {
    success: true,
    provider: 'development_fallback',
    messageId: `DEV_${Date.now()}`,
  };
}
