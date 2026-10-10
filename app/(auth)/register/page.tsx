'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UserPlus, AlertCircle, Eye, EyeOff, Smartphone, CheckCircle2, Loader2, XCircle } from 'lucide-react';

type Step = 'form' | 'waiting' | 'success' | 'failed';

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
  const [countdown, setCountdown] = useState(120); // 2 min timeout
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  // Start polling once we have a pendingId
  useEffect(() => {
    if (step !== 'waiting' || !pendingId) return;

    // Countdown timer
    setCountdown(120);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearAllIntervals();
          setStep('failed');
          setError('Payment timed out. Please try again.');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/register/status?pendingId=${pendingId}`);
        const data = await res.json();

        if (data.status === 'COMPLETED') {
          clearAllIntervals();
          setStep('success');
          // Auto-login after 2 seconds by redirecting to login page
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      setStep('waiting');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── WAITING SCREEN ──
  if (step === 'waiting') {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return (
      <div className="w-full max-w-xl glass-card rounded-3xl p-8 sm:p-12 space-y-8 border border-slate-700/80 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-brand-500 flex items-center justify-center shadow-xl shadow-brand-500/30">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Check Your Phone</h2>
            <p className="text-sm text-slate-400 mt-1">An M-Pesa payment prompt has been sent to your phone</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            Enter your <strong className="text-white">M-Pesa PIN</strong> to pay{' '}
            <strong className="text-emerald-400 font-black text-base">KES 200</strong> and complete your registration.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Waiting for payment confirmation...</span>
          </div>
          <p className="text-xs text-slate-500">
            Time remaining: <span className="text-amber-400 font-mono font-bold">{mins}:{secs.toString().padStart(2, '0')}</span>
          </p>
        </div>

        <p className="text-xs text-slate-500">
          Didn&apos;t receive the prompt?{' '}
          <button
            type="button"
            onClick={() => { clearAllIntervals(); setStep('form'); setError(null); }}
            className="text-brand-400 hover:underline font-semibold cursor-pointer"
          >
            Go back and retry
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
            <h2 className="text-2xl font-black text-white">Account Created! 🎉</h2>
            <p className="text-sm text-slate-400 mt-1">Your payment was confirmed and your account is now active.</p>
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
            <p className="text-sm text-slate-400 mt-1">{error || 'Your M-Pesa payment was not received.'}</p>
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

  // ── REGISTRATION FORM ──
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

      {/* Activation fee notice */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-300">One-time Activation Fee: KES 200</p>
          <p className="text-xs text-slate-400 mt-0.5">
            After filling in your details, you will receive an M-Pesa STK push to your phone. Pay KES 200 to instantly activate your account.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="john@example.co.ke"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Safaricom Phone Number</label>
            <input
              type="tel"
              required
              placeholder="0712345678 or 0110..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
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
            placeholder="e.g. TM-JOHN1234"
            value={formData.referralCode}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-start gap-2 pt-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="terms" className="text-xs text-gray-400 leading-normal">
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
              <span>Register & Pay KES 200 via M-Pesa</span>
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
