'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, CreditCard } from 'lucide-react';

declare global {
  interface Window { PaystackPop: any; }
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const fetchUserAndPackages = async () => {
    try {
      const [pRes, uRes] = await Promise.all([fetch('/api/packages'), fetch('/api/auth/me')]);
      const pData = await pRes.json();
      const uData = await uRes.json();
      if (pData.packages) setPackages(pData.packages);
      if (uData.user) setUser(uData.user);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndPackages();

    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleSelectPackage = async (pkg: any) => {
    if (!user) { window.location.href = '/login'; return; }

    setUpgradingId(pkg.id);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Initialize payment on server
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pkg.price, type: 'PACKAGE' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to initialize payment');

      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

      if (scriptLoaded && window.PaystackPop && publicKey) {
        // 2a. Paystack popup
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: user.email,
          amount: Math.round(pkg.price * 100), // to kobo
          currency: 'KES',
          ref: data.reference,
          label: user.fullName,
          channels: ['mobile_money', 'card', 'bank', 'ussd'],
          metadata: { packageId: pkg.id, packageName: pkg.name, userId: user.id },
          onClose: () => {
            setUpgradingId(null);
            setErrorMsg('Payment window closed. Try again to complete your upgrade.');
          },
          callback: async (response: any) => {
            try {
              // 3. Activate package after payment
              await fetch('/api/packages/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId: pkg.id, reference: response.reference }),
              });
              setSuccessMsg(`🌟 Congratulations! You have successfully upgraded to the ${pkg.name} Tier.`);
              await fetchUserAndPackages();
            } catch {
              setErrorMsg('Payment received but activation failed. Please contact support.');
            } finally {
              setUpgradingId(null);
            }
          },
        });
        handler.openIframe();
      } else {
        // 2b. Redirect fallback
        window.location.href = data.authorizationUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setUpgradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-white">Membership Packages</h1>
        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
          Choose a platform tier that suits your work capacity and task access level.
        </p>

        {errorMsg && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {/* Payment methods supported */}
        <div className="flex flex-wrap gap-2 justify-center pt-1">
          {['M-Pesa', 'Visa / Mastercard', 'Bank Transfer', 'USSD'].map((m) => (
            <span key={m} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-800 text-gray-400 border border-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-3 h-3" /> {m}
            </span>
          ))}
        </div>

        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left leading-relaxed">
          <strong className="text-amber-200 font-bold block mb-1">⚠️ Membership Package Policy:</strong>
          &quot;Packages provide access to different task levels, earning opportunities, daily limits, and bonuses. Packages are not investments and do not guarantee fixed income or financial returns.&quot;
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const isCurrent = user?.packageId === pkg.id;
          const isUpgrading = upgradingId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl glass-card flex flex-col justify-between space-y-6 relative ${
                pkg.name === 'GOLD' ? 'border-brand-500/50 glow-emerald' : ''
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-emerald-500 text-dark-900 text-[10px] font-black uppercase tracking-wider">
                  Current Tier
                </span>
              )}
              {pkg.name === 'GOLD' && !isCurrent && (
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-brand-500 text-dark-900 text-[10px] font-black uppercase tracking-wider">
                  Popular Choice
                </span>
              )}

              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-white">{pkg.name}</h3>
                <div>
                  <span className="text-3xl font-black text-white">KES {pkg.price}</span>
                  <span className="text-xs text-gray-400"> / {pkg.durationDays} days</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{pkg.description}</p>

                <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-gray-300">
                  {pkg.features?.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                disabled
                className="w-full py-3.5 rounded-xl font-extrabold text-xs transition-all text-center flex items-center justify-center gap-2 bg-slate-800/80 text-amber-400/90 border border-amber-500/30 cursor-not-allowed opacity-90 shadow-inner"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Coming Soon
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
