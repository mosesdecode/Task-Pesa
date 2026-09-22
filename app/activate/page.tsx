'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  CreditCard,
} from 'lucide-react';

export default function ActivatePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feeKES, setFeeKES] = useState<number>(200);
  const [paymentMode, setPaymentMode] = useState<'STK' | 'GATEWAY'>('STK');
  const [stkPhone, setStkPhone] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    // Fetch dynamic activation fee from backend (Requirement 1)
    fetch('/api/activation/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.activationFeeKES === 'number') {
          setFeeKES(data.activationFeeKES);
        }
      })
      .catch(() => setFeeKES(200));

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setStkPhone(data.user.mpesaNumber || data.user.phone || '');
          if (data.user.role === 'ADMIN') {
            router.push('/admin');
            return;
          }
          if (data.user.status === 'ACTIVE') {
            setIsActivated(true);
          }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Polling for activation completion
  useEffect(() => {
    if (!paymentProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user && data.user.status === 'ACTIVE') {
          setPaymentProcessing(false);
          setIsActivated(true);
          setStatusMessage('✓ Account successfully activated! Redirecting to tasks...');
          setTimeout(() => router.push('/tasks'), 2500);
        }
      } catch (e) {
        // silent retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentProcessing, router]);

  // Direct Safaricom M-Pesa STK Push
  const handleDirectMpesaStk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: stkPhone || user?.mpesaNumber || user?.phone,
          amount: feeKES,
          type: 'ACTIVATION',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate M-Pesa STK push.');
      }

      setPaymentProcessing(true);
      setStatusMessage('STK Push sent to your Safaricom phone! Please enter your M-Pesa PIN on your phone to complete payment.');
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real payment via Paystack checkout
  const handlePayWithPaystack = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: feeKES,
          type: 'ACTIVATION',
          phone: user?.mpesaNumber || user?.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.authorizationUrl) {
        throw new Error(data.error || 'Failed to initialize payment gateway.');
      }

      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setError(err.message || 'Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (isActivated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg glass-card rounded-3xl p-8 sm:p-10 text-center space-y-6 border border-emerald-500/40 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">✓ Account Activated</h2>
            <p className="text-sm text-gray-300">
              Your TaskMint account is active! You now have full access to start digital tasks, earn rewards, and request withdrawals.
            </p>
          </div>
          <button
            onClick={() => router.push('/tasks')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>Explore Tasks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5 mx-auto shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Account Activation Required</h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Pay the one-time <strong className="text-emerald-400 font-bold">KES {feeKES}</strong> activation fee to unlock tasks &amp; withdrawals.
          </p>
        </div>

        {/* Why Fee Box */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative z-10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Activation Benefits
          </h4>
          <ul className="text-xs text-gray-300 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full access to Data Annotation, Microtasks &amp; App Testing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Access to video ad rewards &amp; WhatsApp campaign rewards</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Earn KES 100 referral reward for every referred account that activates</span>
            </li>
          </ul>
        </div>

        {/* Status Message / Notification */}
        {statusMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            {paymentProcessing && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
            <span className="flex-1 font-medium">{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Amount Summary */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between relative z-10">
          <div>
            <p className="text-xs text-gray-400">One-Time Activation Fee</p>
            <p className="text-2xl font-black text-white">KES {feeKES.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              One-Time Access
            </span>
            <p className="text-[10px] text-gray-400 mt-1">Safaricom M-Pesa</p>
          </div>
        </div>

        {/* STK Push Payment Form */}
        <form onSubmit={handleDirectMpesaStk} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">
              Safaricom Phone Number for M-Pesa Prompt
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stkPhone}
                onChange={(e) => setStkPhone(e.target.value)}
                placeholder="07XXXXXXXX or 011XXXXXXX"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Enter your active Safaricom phone number to receive the instant M-Pesa STK PIN prompt.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || paymentProcessing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending M-Pesa STK Prompt...
              </>
            ) : paymentProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Waiting for M-Pesa PIN...
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5" />
                Send M-Pesa Prompt (KES {feeKES})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Alternative: Paystack Gateway Button */}
        <div className="pt-2 border-t border-slate-800 text-center space-y-3 relative z-10">
          <p className="text-xs text-gray-400">Or pay via card or alternative channel:</p>
          <button
            type="button"
            onClick={handlePayWithPaystack}
            disabled={loading || paymentProcessing}
            className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-gray-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Pay via Card or Paystack Gateway
          </button>
        </div>
      </div>
    </div>
  );
}
