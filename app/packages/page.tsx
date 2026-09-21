'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Smartphone,
  Loader2,
  PhoneCall,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [submittingStk, setSubmittingStk] = useState(false);
  const [stkPending, setStkPending] = useState(false);
  const [stkInfo, setStkInfo] = useState<{
    checkoutRequestId?: string;
    depositId?: string;
    message?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserAndPackages = async () => {
    try {
      const [resPkg, resUser] = await Promise.all([
        fetch('/api/packages'),
        fetch('/api/auth/me'),
      ]);
      const dataPkg = await resPkg.json();
      const dataUser = await resUser.json();

      setPackages(dataPkg.packages || []);
      if (dataUser?.user) {
        setUser(dataUser.user);
        setMpesaPhone(dataUser.user.mpesaNumber || dataUser.user.phone || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndPackages();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const openMpesaModal = (pkg: any) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedPkg(pkg);
    setErrorMsg('');
    setStkPending(false);
    setStkInfo(null);
  };

  const closeModal = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setSelectedPkg(null);
    setStkPending(false);
    setStkInfo(null);
    setErrorMsg('');
  };

  const startPolling = (depositId: string, checkoutRequestId?: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const query = checkoutRequestId
          ? `checkoutRequestId=${checkoutRequestId}`
          : `depositId=${depositId}`;
        const res = await fetch(`/api/mpesa/status?${query}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.isCompleted) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setStkPending(false);
          setSuccessMsg(`🌟 Upgraded to ${selectedPkg?.name} Tier successfully!`);
          closeModal();
          fetchUserAndPackages();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);
  };

  const handleInitiateMpesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !mpesaPhone) return;

    setSubmittingStk(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: mpesaPhone,
          amount: selectedPkg.price,
          type: 'PACKAGE',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send M-Pesa STK Push');
      }

      setStkPending(true);
      setStkInfo({
        checkoutRequestId: data.checkoutRequestId,
        depositId: data.depositId,
        message: data.CustomerMessage || `STK Push sent to ${mpesaPhone}. Enter your PIN.`,
      });

      if (data.depositId) {
        startPolling(data.depositId, data.checkoutRequestId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'M-Pesa transaction failed.');
    } finally {
      setSubmittingStk(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
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

        {errorMsg && !selectedPkg && (
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
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Safaricom M-Pesa STK Push
          </span>
        </div>

        <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left leading-relaxed">
          <strong className="text-amber-200 font-bold block mb-1">⚠️ Membership Package Policy:</strong>
          &quot;Packages provide access to different task levels, earning opportunities, daily limits, and bonuses. Packages are not investments and do not guarantee fixed income or financial returns.&quot;
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const isCurrent = user?.packageId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl glass-card flex flex-col justify-between space-y-6 relative border transition-all ${
                pkg.name === 'GOLD' ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-slate-800'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-emerald-500 text-dark-900 text-[10px] font-black uppercase tracking-wider">
                  Current Tier
                </span>
              )}
              {pkg.name === 'GOLD' && !isCurrent && (
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-emerald-400 text-dark-900 text-[10px] font-black uppercase tracking-wider">
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
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
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

      {/* M-Pesa Upgrade Modal */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Upgrade to {selectedPkg.name}</h3>
              <p className="text-xs text-gray-400">
                Amount: <strong className="text-emerald-400 text-sm">KES {selectedPkg.price}.00</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {stkPending ? (
              <div className="space-y-4 text-center bg-slate-800/80 p-5 rounded-2xl border border-emerald-500/40">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto animate-pulse">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">STK Prompt Sent!</h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Check your phone (<strong>{mpesaPhone}</strong>) and enter your M-Pesa PIN.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 py-1.5 px-3 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Waiting for confirmation...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInitiateMpesa} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                    <span>M-Pesa Phone Number</span>
                    <span className="text-[10px] text-emerald-400">Safaricom</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingStk || !mpesaPhone}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingStk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending STK Push...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" /> Pay KES {selectedPkg.price} via M-Pesa
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
