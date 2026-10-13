/**
 * Email OTP Provider for TaskMint
 *
 * Uses Nodemailer + Gmail SMTP (App Password) to send:
 *  - Registration OTP (Step 1 of 2)
 *  - Withdrawal authorization OTP
 *
 * Environment variables required:
 *  - EMAIL_USER   : taskmintagencies@gmail.com
 *  - EMAIL_PASS   : 16-char Gmail App Password (no spaces)
 *  - EMAIL_FROM   : optional display name override
 */

import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOtpResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

// ── Transporter (singleton pattern so it is not rebuilt on every request) ──
let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}

// ── HTML email template ──
function buildOtpEmail(
  otp: string,
  purpose: 'REGISTRATION' | 'WITHDRAWAL' | 'VERIFICATION' | 'PASSWORD_RESET',
  recipientName?: string
): { subject: string; html: string; text: string } {
  const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';

  const purposeConfig = {
    REGISTRATION: {
      subject: 'TaskMint — Your Registration Verification Code',
      action: 'complete your account registration',
      notice: 'If you did not sign up for TaskMint, you can safely ignore this email.',
    },
    WITHDRAWAL: {
      subject: 'TaskMint — Withdrawal Authorization Code',
      action: 'authorize your withdrawal request',
      notice:
        'If you did not initiate this withdrawal, please secure your account immediately and contact support.',
    },
    VERIFICATION: {
      subject: 'TaskMint — Email Verification Code',
      action: 'verify your email address',
      notice: 'If you did not request this code, you can safely ignore this email.',
    },
    PASSWORD_RESET: {
      subject: 'TaskMint — Password Reset Verification Code',
      action: 'reset your account login password',
      notice:
        'If you did not request a password reset, please ignore this email or review your security settings immediately.',
    },
  };

  const cfg = purposeConfig[purpose];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${cfg.subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:16px;vertical-align:middle;">TM</div>
                <span style="color:#fff;font-size:22px;font-weight:900;vertical-align:middle;margin-left:10px;">TaskMint</span>
              </div>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px;">Global Work Space · Kenya</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="color:#94a3b8;font-size:15px;margin:0 0 8px;">${greeting}</p>
              <p style="color:#e2e8f0;font-size:15px;margin:0 0 32px;line-height:1.6;">
                Use the verification code below to <strong style="color:#fff;">${cfg.action}</strong>.
                This code expires in <strong style="color:#22c55e;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#0f172a;border:2px dashed #22c55e;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="color:#64748b;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
                <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#22c55e;font-family:monospace;">
                  ${otp}
                </div>
              </div>

              <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
                ⚠️ <strong style="color:#f59e0b;">NEVER share this code with anyone.</strong>
                TaskMint staff will never ask for your OTP.
              </p>
            </td>
          </tr>

          <!-- Notice -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;">
                <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">
                  ${cfg.notice}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #334155;padding:20px 40px;text-align:center;">
              <p style="color:#475569;font-size:11px;margin:0;">
                © ${new Date().getFullYear()} TaskMint Global · 
                <a href="https://taskmintglobal.com" style="color:#22c55e;text-decoration:none;">taskmintglobal.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\nYour TaskMint ${purpose.toLowerCase()} verification code is:\n\n${otp}\n\nThis code expires in 10 minutes. NEVER share it with anyone.\n\n${cfg.notice}\n\n© TaskMint Global`;

  return { subject: cfg.subject, html, text };
}

// ── Main exported function ──
export async function sendEmailOtp(
  email: string,
  otpCode: string,
  purpose: 'REGISTRATION' | 'WITHDRAWAL' | 'VERIFICATION' | 'PASSWORD_RESET' = 'VERIFICATION',
  recipientName?: string
): Promise<SendEmailOtpResult> {
  // Fallback: development mode with no email config
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(
      `[EMAIL OTP - DEV MODE] To: ${email} | Purpose: ${purpose} | Code: ${otpCode}`
    );
    return { success: true, provider: 'development' };
  }

  try {
    const transporter = getTransporter();
    const { subject, html, text } = buildOtpEmail(otpCode, purpose, recipientName);

    const fromName = process.env.EMAIL_FROM || 'TaskMint Global';
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL OTP SENT] To: ${email} | Purpose: ${purpose} | MsgId: ${info.messageId}`);
    return { success: true, provider: 'gmail', messageId: info.messageId };
  } catch (err: any) {
    console.error('[EMAIL OTP ERROR]:', err);
    return { success: false, provider: 'gmail', error: err.message };
  }
}
