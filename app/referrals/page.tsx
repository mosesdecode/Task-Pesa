'use client';

import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Share2, Shield, Sparkles, TrendingUp } from 'lucide-react';

export default function ReferralsPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referrals')
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const referrals = data?.referrals || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Referral Program</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Invite friends to activate their TaskPesa accounts and earn referral bonuses.
        </p>
      </div>

      {/* Referral Link Copy Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-brand-950 via-slate-900 to-slate-900 border border-brand-500/40 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Your Referral Link
            </span>
            <h3 className="text-lg font-bold text-white">Share link with friends or on social media</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-gray-300">
            <span>Code:</span>
            <strong className="text-brand-400 font-bold text-sm">{data?.referralCode}</strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={data?.referralLink || ''}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-brand-300 text-sm font-mono focus:outline-none"
          />
          <button
            onClick={() => copyToClipboard(data?.referralLink || '')}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Link!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Referral Stats Cards (Requirement 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Invites</span>
          <p className="text-3xl font-black text-white">{stats.totalReferrals || 0}</p>
          <p className="text-[11px] text-gray-400">Total accounts registered</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Qualified Invites</span>
          <p className="text-3xl font-black text-brand-400">{stats.activeReferrals || 0}</p>
          <p className="text-[11px] text-gray-400">Completed account activation</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Invites</span>
          <p className="text-3xl font-black text-amber-400">{stats.pendingReferrals || 0}</p>
          <p className="text-[11px] text-gray-400">Awaiting KES 200 activation</p>
        </div>

        <div className="p-6 rounded-3xl glass-card space-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Referral Earnings</span>
          <p className="text-3xl font-black text-emerald-400">
            KES {(stats.totalEarnings || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Credited to available balance</p>
        </div>
      </div>

      {/* Referral Network History */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          Referred Users Network
        </h3>

        <div className="p-6 rounded-3xl glass-card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                <th className="pb-3">User</th>
                <th className="pb-3">Reward</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No referrals yet. Share your link to start earning bonuses!
                  </td>
                </tr>
              ) : (
                referrals.map((ref: any) => (
                  <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-semibold text-white">
                      {ref.referredUser?.fullName} (@{ref.referredUser?.username})
                    </td>
                    <td className="py-3 font-mono font-bold text-brand-400">
                      KES {ref.rewardAmount.toFixed(2)}
                    </td>
                    <td className="py-3 font-medium">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ref.status === 'QUALIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 font-mono text-[10px]">
                      {new Date(ref.createdAt).toLocaleDateString('en-KE')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
