'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle2,
  Loader2,
  XCircle,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';

type Step = 'form' | 'otp' | 'waiting' | 'success' | 'failed';

function RegisterForm() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    mpesaNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string>('');
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(60);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling state for payment
  const [countdown, setCountdown] = useState(120);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  // Handle OTP resend cooldown timer
  useEffect(() => {
    if (step === 'otp') {
      setOtpCooldown(60);
      cooldownTimerRef.current = setInterval(() => {
        setOtpCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [step]);

  // Start polling once we have a pendingId in waiting step
  useEffect(() => {
    if (step !== 'waiting' || !pendingId) return;

    setCountdown(120);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearAllIntervals();
          setStep('failed');
          setError('Payment confirmation timed out. Please try again.');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/register/status?pendingId=${pendingId}`);
        const data = await res.json();

        if (data.status === 'COMPLETED') {
          clearAllIntervals();
          setStep('success');
          setTimeout(() => {
            window.location.href = '/login?registered=1';
          }, 2500);
        } else if (data.status === 'FAILED' || data.status === 'NOT_FOUND') {
          clearAllIntervals();
          setStep('failed');
          setError('Payment was not completed. Please try again.');
        }
      } catch {
        // silently ignore poll errors
      }
    }, 3000);

    return () => clearAllIntervals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pendingId]);

  function clearAllIntervals() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }

  // Step 1: Submit Form -> Sends Email OTP
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          mpesaNumber: formData.mpesaNumber?.trim() || formData.phone.trim(),
          password: formData.password,
          referralCode: formData.referralCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setPendingId(data.pendingId);
      setSentEmail(data.email);
      if (data.demoCode) setDemoCode(data.demoCode);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP -> Redirects to Paystack KES 200 Payment
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingId,
          code: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      if (data.authorizationUrl) {
        // Redirect directly to Paystack hosted checkout for KES 200
        window.location.href = data.authorizationUrl;
      } else {
        setStep('waiting');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend OTP via Africa's Talking
  const handleResendOtp = async () => {
    if (otpCooldown > 0 || resendingOtp || !pendingId) return;

    setResendingOtp(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId, resend: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');

      if (data.demoCode) setDemoCode(data.demoCode);
      setOtpCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendingOtp(false);
    }
  };

  // ── STEP 2: OTP VERIFICATION SCREEN ──
  if (step === 'otp') {
    return (
      <div className="w-full max-w-xl glass-card rounded-3xl p-8 sm:p-12 space-y-8 border border-slate-700/80 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
            Step 1 of 2 · Email Verification
          </span>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-brand-500/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Check Your Email</h2>
            <p className="text-sm text-slate-400 mt-1">
              Enter the 6-digit verification code sent to{' '}
              <strong className="text-emerald-400 font-mono">{sentEmail}</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">Check your inbox and spam/junk folder.</p>
          </div>
        </div>

        {demoCode && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            Development Mode OTP: <strong className="font-mono text-sm tracking-wider">{demoCode}</strong>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-center text-3xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-brand-500 transition-all shadow-inner"
            />
            <p className="text-xs text-slate-500">Code expires in 10 minutes</p>
          </div>

          <button
            type="submit"
            disabled={verifyingOtp || otpCode.length !== 6}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {verifyingOtp ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Verify & Pay KES 200 via Paystack</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setStep('form'); setError(null); }}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Details</span>
          </button>

          <button
            type="button"
            disabled={otpCooldown > 0 || resendingOtp}
            onClick={handleResendOtp}
            className="inline-flex items-center gap-1.5 text-brand-400 hover:underline font-semibold disabled:opacity-40 disabled:no-underline cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
            <span>{otpCooldown > 0 ? `Resend Code (${otpCooldown}s)` : 'Resend Code'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── STEP 3: WAITING FOR PAYMENT SCREEN ──
  if (step === 'waiting') {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return (
      <div className="w-full max-w-xl glass-card rounded-3xl p-8 sm:p-12 space-y-8 border border-slate-700/80 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Step 2 of 2 · Account Activation
          </span>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-brand-500 flex items-center justify-center shadow-xl shadow-brand-500/30">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Payment in Progress</h2>
            <p className="text-sm text-slate-400 mt-1">Completing your KES 200 account activation</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            Please complete your payment on the Paystack checkout. Your account will automatically activate once confirmed.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Listening for payment confirmation...</span>
          </div>
          <p className="text-xs text-slate-500">
            Time remaining: <span className="text-amber-400 font-mono font-bold">{mins}:{secs.toString().padStart(2, '0')}</span>
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Encountering issues?{' '}
          <button
            type="button"
            onClick={() => { clearAllIntervals(); setStep('form'); setError(null); }}
            className="text-brand-400 hover:underline font-semibold cursor-pointer"
          >
            Go back to registration
          </button>
        </p>
      </div>
    );
  }

  // ── SUCCESS SCREEN ──
  if (step === 'success') {
    return (
      <div className="w-full max-w-xl glass-card rounded-3xl p-8 sm:p-12 space-y-6 border border-emerald-500/30 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Account Created & Activated! 🎉</h2>
            <p className="text-sm text-slate-400 mt-1">Your payment was confirmed and your account is now ready for tasks.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Redirecting you to login...</p>
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // ── FAILED SCREEN ──
  if (step === 'failed') {
    return (
      <div className="w-full max-w-xl glass-card rounded-3xl p-8 sm:p-12 space-y-6 border border-rose-500/30 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-rose-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Payment Not Completed</h2>
            <p className="text-sm text-slate-400 mt-1">{error || 'Your activation payment was not confirmed.'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setStep('form'); setError(null); }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 text-slate-950 font-black text-sm cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── STEP 1: REGISTRATION FORM ──
  return (
    <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-700/80 shadow-2xl">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-brand-500/20">
            TM
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Create Your TaskMint Account</h1>
        <p className="text-xs text-gray-400">Join Kenya&apos;s premier global work space</p>
      </div>

      {/* Step notice */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              Step 1 of 2
            </span>
            <span className="text-sm font-bold text-white">Email Verification</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your details to receive an email verification code. Step 2 activates your account with KES 200 via Paystack.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleInitiate} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Kamau"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Username</label>
            <input
              type="text"
              required
              placeholder="e.g. johnkamau"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300">Email Address</label>
          <input
            type="email"
            required
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Safaricom Phone Number</label>
            <input
              type="tel"
              required
              placeholder="0712345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <p className="text-[10px] text-slate-500">Will receive verification SMS code</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">M-Pesa Number (for Payouts)</label>
            <input
              type="tel"
              placeholder="Same as phone if blank"
              value={formData.mpesaNumber}
              onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-gray-500 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300">Referral Code (Optional)</label>
          <input
            type="text"
            placeholder="e.g. TM-JOHN123"
            value={formData.referralCode}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input type="checkbox" required id="terms" className="mt-1 accent-emerald-500 cursor-pointer" />
          <label htmlFor="terms" className="text-xs text-gray-400">
            I agree to the{' '}
            <Link href="/terms" className="text-brand-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-brand-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
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
              <Smartphone className="w-4 h-4" />
              <span>Verify Phone & Continue</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 font-bold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-xl p-10 text-center text-slate-400">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
