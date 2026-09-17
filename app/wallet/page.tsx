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
} from 'lucide-react';

export default function WalletPage() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Wallet & M-Pesa Withdrawals</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Track earnings ledger, request weekly M-Pesa payouts, and view transaction history.
        </p>
      </div>

      {/* Weekly Schedule Callout (Requirement 11) */}
      <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-3">
        <Calendar className="w-5 h-5 text-brand-400 shrink-0" />
        <div>
          <strong className="text-white block font-semibold">Weekly Payout Schedule:</strong>
          "Withdrawals are processed weekly on Fridays. Minimum withdrawal amount is KES 2,500."
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Balance</span>
          <p className="text-3xl font-black text-brand-400">
            KES {availableBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Withdrawable via M-Pesa</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Balance</span>
          <p className="text-3xl font-black text-white">
            KES {(wallet.pendingBalance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Under review or pending payout</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Cumulative Earned</span>
          <p className="text-3xl font-black text-white">
            KES {(wallet.totalEarned || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Tasks, ads, and referral bonuses</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Withdrawn</span>
          <p className="text-3xl font-black text-emerald-400">
            KES {(wallet.totalWithdrawn || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Disbursed to M-Pesa</p>
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
            <p className="text-xs text-gray-400">Safaricom M-Pesa B2C Transfer</p>
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
                <span className="text-brand-400 font-bold">Min: KES 2,500</span>
              </div>
              <input
                type="number"
                min="2500"
                step="50"
                required
                placeholder="2500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500 font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={requesting || availableBalance < 2500}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                availableBalance >= 2500
                  ? 'bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white shadow-xl shadow-brand-500/20 hover:scale-[1.02]'
                  : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {requesting
                ? 'Submitting...'
                : availableBalance >= 2500
                ? 'Submit Withdrawal Request'
                : 'Min KES 2,500 Required'}
            </button>
          </form>
        </div>

        {/* Transaction History Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            Transaction History
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
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] border border-slate-700 text-brand-400">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">{tx.description}</td>
                      <td className={`py-3 font-bold font-mono ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount >= 0 ? '+' : ''}KES {tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          {tx.status}
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
    </div>
  );
}
