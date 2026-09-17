'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

// Load Paystack inline JS popup
declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function ActivatePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.status === 'ACTIVE') {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      });

    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [router]);

  const handlePayWithPaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Initialize payment on server — gets authorization_url + reference
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 200, type: 'ACTIVATION' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to initialize payment');

      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

      if (scriptLoaded && window.PaystackPop && publicKey) {
        // 2a. Use Paystack popup if available
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: user.email,
          amount: 20000, // KES 200 × 100
          currency: 'KES',
          ref: data.reference,
          label: user.fullName,
          channels: ['mobile_money', 'card', 'bank', 'ussd'],
          onClose: () => {
            setLoading(false);
            setError('Payment window closed. Please try again to complete activation.');
          },
          callback: async (response: any) => {
            // 3. Verify on server
            try {
              const verifyRes = await fetch(`/api/paystack/verify?reference=${response.reference}`);
              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                router.push('/dashboard?activated=true');
              } else {
                setError('Payment received but verification failed. Please contact support.');
                setLoading(false);
              }
            } catch {
              setError('Verification error. Please contact support with reference: ' + response.reference);
              setLoading(false);
            }
          },
        });
        handler.openIframe();
      } else {
        // 2b. Fallback: redirect to Paystack hosted page
        window.location.href = data.authorizationUrl;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-700/80 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 mx-auto shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-brand-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Account Activation Required</h2>
          <p className="text-xs text-gray-400">Pay the KES 200 platform access fee to start earning rewards.</p>
        </div>

        {/* Access Fee Explanation */}
        <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Why is there a KES 200 fee?
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            &quot;The activation fee provides access to the platform and helps prevent fraudulent and duplicate accounts. Earnings depend on the availability and successful completion of eligible tasks. No fixed income or guaranteed returns are promised.&quot;
          </p>
          <ul className="text-xs text-gray-400 space-y-1.5 pt-2 border-t border-slate-700/60">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Unlocks full access to Data Annotation &amp; Microtasks</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Enables sponsored video ad views &amp; WhatsApp promo campaigns</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Activates unique referral link &amp; referral commissions</span>
            </li>
          </ul>
        </div>

        {/* Payment Methods Badge */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['M-Pesa', 'Card', 'Bank Transfer', 'USSD'].map((method) => (
            <span
              key={method}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-gray-300 border border-slate-700"
            >
              {method}
            </span>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePayWithPaystack} className="space-y-4">
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Activation Amount</p>
              <p className="text-xl font-black text-white">KES 200.00</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              One-Time Access
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-black text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay KES 200 via Paystack
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            Secured by{' '}
            <span className="text-brand-400 font-semibold">Paystack</span> · Supports M-Pesa, Card &amp; Bank
          </p>
        </form>
      </div>
    </div>
  );
}
