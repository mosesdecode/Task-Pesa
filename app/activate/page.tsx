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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.role === 'ADMIN') {
            router.push('/admin');
            return;
          }
          if (data.user.status === 'ACTIVE') {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Real payment via Paystack (M-Pesa STK Push on phone)
  const handlePayWithPaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 200,
          type: 'ACTIVATION',
          phone: user?.mpesaNumber || user?.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.authorizationUrl) {
        throw new Error(data.error || 'Failed to initialize payment gateway.');
      }

      // Redirect directly to Paystack's hosted checkout (handles M-Pesa STK Push cleanly with no popup callback errors)
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
            Pay the one-time <strong className="text-emerald-400 font-bold">KES 200</strong> platform access fee to unlock tasks &amp; withdrawals.
          </p>
        </div>

        {/* Why Fee Box */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 relative z-10">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Why is there a KES 200 fee?
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            The activation fee provides access to the platform and acts as an identity filter to prevent bot accounts.
            Earnings depend on the availability and successful completion of eligible tasks.
          </p>
          <ul className="text-xs text-gray-400 space-y-2 pt-2 border-t border-slate-700/60">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlocks full access to Data Annotation &amp; Microtasks</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Enables sponsored video ad views &amp; WhatsApp promo campaigns</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Activates unique referral link &amp; referral commissions</span>
            </li>
          </ul>
        </div>

        {/* Payment Methods Badges */}
        <div className="flex flex-wrap gap-2 justify-center relative z-10">
          {['M-Pesa STK Push', 'Card', 'Bank Transfer'].map((method) => (
            <span
              key={method}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-gray-300 border border-slate-700 flex items-center gap-1.5"
            >
              {method.includes('M-Pesa') ? (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <CreditCard className="w-3.5 h-3.5 text-brand-400" />
              )}
              {method}
            </span>
          ))}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Payment Action Form */}
        <form onSubmit={handlePayWithPaystack} className="space-y-4 relative z-10">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Activation Amount</p>
              <p className="text-2xl font-black text-white">KES 200.00</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                One-Time Access
              </span>
              <p className="text-[10px] text-gray-400 mt-1">M-Pesa Supported</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting to Paystack M-Pesa Gateway...
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5" />
                Pay KES 200 via M-Pesa / Card
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            Secured by <strong className="text-emerald-400 font-semibold">Paystack</strong> · Sends live M-Pesa STK Push prompt to your phone
          </p>
        </form>
      </div>
    </div>
  );
}
