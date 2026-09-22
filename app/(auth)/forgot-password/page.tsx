'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { normalizeKenyanPhone, isSafaricomNumber, formatKenyanPhoneDisplay } from '@/lib/phone';

function ForgotPasswordForm() {
  const router = useRouter();

  // Step: 1 = Phone, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Step 1: Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!phone.trim()) {
      setError('Please enter your registered Safaricom phone number.');
      return;
    }

    const normalized = normalizeKenyanPhone(phone.trim());
    if (!isSafaricomNumber(normalized)) {
      setError('Please enter a valid Kenyan Safaricom phone number (07XX or 011X).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.retryAfter) setCooldown(data.retryAfter);
        throw new Error(data.error || 'Failed to send reset code');
      }

      setSuccessMsg(data.message || 'Verification code sent!');
      setCooldown(60);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit numeric verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizeKenyanPhone(phone.trim()),
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResetToken(data.resetToken);
      setSuccessMsg('Code verified! Enter your new password.');
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-700/80 shadow-2xl">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-brand-500/20">
            TM
          </div>
        </Link>
        <h1 className="text-2xl font-black text-white">Reset Account Password</h1>
        <p className="text-xs text-gray-400">
          Recover access to your TaskMint account using your verified Safaricom phone number.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              step === s
                ? 'w-8 bg-brand-500'
                : step > s
                ? 'w-4 bg-emerald-500'
                : 'w-4 bg-slate-800'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && step !== 4 && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Enter Safaricom Phone Number */}
      {step === 1 && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase">
              Safaricom Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="07XXXXXXXX or 011XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-brand-500"
              />
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              We will send a 6-digit verification code to this phone number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Enter 6-digit OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 uppercase">
                6-Digit Verification Code
              </label>
              {cooldown > 0 ? (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-brand-400" /> {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading}
                  className="text-[11px] text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Resend
                </button>
              )}
            </div>

            <input
              type="text"
              maxLength={6}
              required
              placeholder="••••••"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tracking-[0.5em] text-center text-xl font-bold focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Sent to <strong className="font-mono text-white">{formatKenyanPhoneDisplay(phone)}</strong>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Verify Code</span>
                <ShieldCheck className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-center text-xs text-gray-400 hover:text-white pt-2 cursor-pointer"
          >
            Change Phone Number
          </button>
        </form>
      )}

      {/* STEP 3: Enter New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase">
              New Password (min 8 characters)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Save New Password</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Password Reset Successful!</h2>
            <p className="text-xs text-gray-400">
              Your TaskMint account password has been updated. You can now log in using your new credentials.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {step !== 4 && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">
            Remember your password?{' '}
            <Link href="/login" className="text-brand-400 font-bold hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md p-10 text-center text-slate-400">Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
