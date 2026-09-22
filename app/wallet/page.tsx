'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Calendar,
  History,
  ShieldCheck,
  XCircle,
  KeyRound,
  Lock,
} from 'lucide-react';

export default function WalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);

  const fetchWallet = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login?redirect=/wallet';
        return;
      }
      const meData = await meRes.json();
      if (!meData.user) {
        window.location.href = '/login?redirect=/wallet';
        return;
      }
      setUser(meData.user);

      const [wRes, reqRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/withdrawals'),
      ]);

      if (wRes.status === 401) {
        window.location.href = '/login?redirect=/wallet';
        return;
      }

      if (wRes.ok) {
        const wData = await wRes.json();
        setWalletData(wData);
      }
      if (reqRes.ok) {
        const rData = await reqRes.json();
        if (rData.eligibility) setEligibility(rData.eligibility);
      }
    } catch (e) {
      console.error(e);
      window.location.href = '/login?redirect=/wallet';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    setOtpMessage(null);
    try {
      const res = await fetch('/api/auth/otp/send', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpMessage(data.message);
      setShowOtpModal(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingOtp(true);
    setOtpMessage(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setOtpMessage(data.message);
      setTimeout(() => {
        setShowOtpModal(false);
        fetchWallet();
      }, 1500);
    } catch (err: any) {
      setOtpMessage(`Error: ${err.message}`);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setRequesting(true);

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, mpesaNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal request failed');

      setMessage({ type: 'success', text: data.message });
      setAmount('');
      fetchWallet();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const wallet = walletData?.wallet || {};
  const transactions = walletData?.transactions || [];
  const withdrawals = walletData?.withdrawals || [];
  const availableBalance = wallet.availableBalance || 0;
  const checks = eligibility?.checks || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Wallet & M-Pesa Withdrawals</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Track earnings, verify your Safaricom phone number, and submit payout requests (Min KES 500).
        </p>
      </div>

      {/* Balance Summary Cards (Requirement 20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl glass-card space-y-2 border-brand-500/30 glow-emerald">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Balance</span>
          <p className="text-3xl font-black text-brand-400">
            KES {availableBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Withdrawable via M-Pesa</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task Earnings</span>
          <p className="text-3xl font-black text-white">
            KES {(walletData?.taskEarnings || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Approved task completions</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Earnings</span>
          <p className="text-3xl font-black text-emerald-400">
            KES {(walletData?.referralEarnings || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">KES 100 per activated referral</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Earnings</span>
          <p className="text-3xl font-black text-amber-400">
            KES {(walletData?.pendingEarnings || wallet.pendingBalance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Pending admin payout review</p>
        </div>
      </div>

      {/* Withdrawal Eligibility Checklist */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              Withdrawal Eligibility Pipeline
            </h3>
            <p className="text-xs text-gray-400">All 5 criteria must be satisfied to initiate an M-Pesa payout</p>
          </div>
          {eligibility?.isEligible ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4" /> Eligible for Withdrawal
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
              <Lock className="w-4 h-4" /> Requirements Pending
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Rule 1: Min 10 Completed Tasks */}
          <div className={`p-4 rounded-2xl border ${checks.minTasks?.met ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-gray-300'} space-y-1`}>
            <div className="flex items-center justify-between font-bold">
              <span>1. Approved Tasks</span>
              {checks.minTasks?.met ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-gray-400 text-[11px]">Must complete at least 10 approved tasks</p>
            <p className="font-mono text-white font-bold">{checks.minTasks?.current || 0} / 10 Completed</p>
          </div>

          {/* Rule 2: Account Age 5 Days */}
          <div className={`p-4 rounded-2xl border ${checks.accountAge?.met ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-gray-300'} space-y-1`}>
            <div className="flex items-center justify-between font-bold">
              <span>2. Account Age</span>
              {checks.accountAge?.met ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-gray-400 text-[11px]">Account age must be at least 5 days</p>
            <p className="font-mono text-white font-bold">{checks.accountAge?.current || 0} / 5 Days</p>
          </div>

          {/* Rule 3: 5 Active Referrals */}
          <div className={`p-4 rounded-2xl border ${checks.activeReferrals?.met ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-gray-300'} space-y-1`}>
            <div className="flex items-center justify-between font-bold">
              <span>3. Active Referrals</span>
              {checks.activeReferrals?.met ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-gray-400 text-[11px]">Must have at least 5 active activated referrals</p>
            <p className="font-mono text-white font-bold">{checks.activeReferrals?.current || 0} / 5 Referrals</p>
          </div>

          {/* Rule 4: Non-Referral Work Check */}
          <div className={`p-4 rounded-2xl border ${checks.nonReferralBalance?.met ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-gray-300'} space-y-1`}>
            <div className="flex items-center justify-between font-bold">
              <span>4. Non-Referral Earnings</span>
              {checks.nonReferralBalance?.met ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-gray-400 text-[11px]">Balance cannot be 100% from referrals</p>
            <p className="font-mono text-white font-bold">{checks.nonReferralBalance?.met ? 'Verified (Tasks Done)' : 'Requires Task Earnings'}</p>
          </div>

          {/* Rule 5: Phone OTP Verification */}
          <div className={`p-4 rounded-2xl border ${checks.phoneVerified?.met ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-gray-300'} space-y-2`}>
            <div className="flex items-center justify-between font-bold">
              <span>5. Safaricom Phone OTP</span>
              {checks.phoneVerified?.met ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            {checks.phoneVerified?.met ? (
              <p className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Safaricom Phone Verified
              </p>
            ) : (
              <button
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full py-1.5 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                {sendingOtp ? 'Sending OTP...' : 'Verify Phone via OTP'}
              </button>
            )}
          </div>

          {/* Rule 6: 48hr Rate Limit */}
          <div className={`p-4 rounded-2xl border ${checks.rateLimit?.met ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-gray-300'} space-y-1`}>
            <div className="flex items-center justify-between font-bold">
              <span>6. 48h Payout Cooldown</span>
              {checks.rateLimit?.met ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-gray-400 text-[11px]">Maximum 1 withdrawal per 48 hours</p>
            <p className="font-mono text-white font-bold">{checks.rateLimit?.met ? 'Ready' : 'Cooldown Active'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Withdrawal Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Withdrawal Form */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card border-brand-500/30 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-brand-400" />
              Request Withdrawal
            </h3>
            <p className="text-xs text-gray-400">Safaricom M-Pesa Payout (Fixed Fee KES 10)</p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawalRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">M-Pesa Phone Number</label>
              <input
                type="tel"
                required
                placeholder="254712345678 or 0712345678"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-gray-300">Amount (KES)</label>
                <span className="text-brand-400 font-bold">Min: KES 500</span>
              </div>
              <input
                type="number"
                min="500"
                step="10"
                required
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 font-mono font-bold"
              />
              <p className="text-[11px] text-gray-400 flex justify-between pt-1">
                <span>Fixed processing fee:</span>
                <span className="text-amber-400 font-bold">KES 10.00</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={requesting || availableBalance < 500}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                availableBalance >= 500
                  ? 'bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white shadow-xl shadow-brand-500/20 hover:scale-[1.02]'
                  : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {requesting
                ? 'Submitting...'
                : availableBalance >= 500
                ? 'Submit Withdrawal Request'
                : 'Min KES 500 Required'}
            </button>
          </form>
        </div>

        {/* Transaction History & Pending Payout Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            Payout & Transaction History
          </h3>

          <div className="p-6 rounded-3xl glass-card overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No transaction history yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-semibold text-gray-200">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] border border-slate-700 text-brand-400 font-bold">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">{tx.description}</td>
                      <td className={`py-3 font-bold font-mono ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount >= 0 ? '+' : ''}KES {tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 font-medium">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED' || tx.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {tx.status === 'PENDING' ? 'PENDING ADMIN PAYOUT' : tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 font-mono text-[10px]">
                        {new Date(tx.createdAt).toLocaleDateString('en-KE')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Phone OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl glass-card border-brand-500/40 space-y-6 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-400" />
                Safaricom OTP Verification
              </h3>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-gray-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              An OTP verification code was sent to your phone. Enter the 6-digit code below to confirm your line for withdrawals.
            </p>

            {otpMessage && (
              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
                {otpMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono text-xl tracking-widest focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otpCode.length !== 6}
                className="w-full py-3.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg hover:scale-105 disabled:opacity-50"
              >
                {verifyingOtp ? 'Verifying...' : 'Verify Phone Number'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
