'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Clock,
  TrendingUp,
  Users,
  CheckSquare,
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  PlaySquare,
  Share2,
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        if (data.user.status === 'PENDING_ACTIVATION') {
          router.push('/activate');
          return;
        }

        // Fetch wallet details
        fetch('/api/wallet')
          .then((res) => res.json())
          .then((wData) => {
            setWallet(wData.wallet);
            setRecentTransactions(wData.transactions || []);
          });

        // Fetch sample available tasks
        fetch('/api/tasks')
          .then((res) => res.json())
          .then((tData) => {
            if (tData.tasks) setTasks(tData.tasks.slice(0, 3));
          })
          .finally(() => setLoading(false));
      });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const availableBalance = wallet?.availableBalance || 0;
  const pendingBalance = wallet?.pendingBalance || 0;
  const totalEarned = wallet?.totalEarned || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 uppercase tracking-wider">
              {user.package?.name || 'BRONZE'} TIER
            </span>
            {user.status === 'ACTIVE' && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Account Active
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Jambo, {user.fullName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Welcome back to your task dashboard. Manage earnings, complete data annotation tasks, and track M-Pesa payouts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            href="/tasks"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-105 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Explore Tasks
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid (Requirement 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            KES {totalEarned.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Cumulative task rewards & bonuses</p>
        </div>

        {/* Available Balance */}
        <div className="p-6 rounded-3xl glass-card space-y-3 border-brand-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Available Balance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-brand-400">
            KES {availableBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Min Payout: KES 500</span>
            <Link href="/wallet" className="text-brand-400 font-bold hover:underline">
              Withdraw →
            </Link>
          </div>
        </div>

        {/* Pending Earnings */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            KES {pendingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Under quality review or Friday payout</p>
        </div>

        {/* Active Package & Next Payout */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Package</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-white">{user.package?.name || 'BRONZE'}</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Next Payout: Friday</span>
            <Link href="/packages" className="text-brand-400 font-bold hover:underline">
              Upgrade
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Quick Tasks & Activity Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-white">Available Tasks For You</h3>
            <Link href="/tasks" className="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1">
              View All Tasks
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="p-5 rounded-2xl glass-card glass-card-hover flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-brand-400 border border-slate-700">
                      {task.category?.name || 'Task'}
                    </span>
                    <span className="text-[10px] text-gray-400">{task.remainingSlots} slots remaining</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{task.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{task.instructions}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-base font-black text-brand-400">KES {task.reward.toFixed(2)}</p>
                  <Link
                    href="/tasks"
                    className="inline-block px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-dark-900 text-white font-bold text-xs transition-colors border border-slate-700"
                  >
                    Start Task
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet & Referral Shortcuts */}
        <div className="space-y-6">
          {/* Withdrawal Progress Bar */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <h4 className="text-sm font-bold text-white">Withdrawal Progress (KES 500 Min)</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-400">Current Balance</span>
                <span className="text-brand-400">
                  {Math.min(100, Math.round((availableBalance / 500) * 100))}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (availableBalance / 500) * 100)}%` }}
                />
              </div>
            </div>
            <Link
              href="/wallet"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Wallet className="w-4 h-4 text-brand-400" />
              Manage Wallet & Withdraw
            </Link>
          </div>

          {/* Referral Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-950/80 to-slate-900 border border-brand-500/30 space-y-3">
            <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Referral Program
            </div>
            <h4 className="text-base font-extrabold text-white">Invite Friends & Earn Rewards</h4>
            <p className="text-xs text-gray-300">
              Share your referral code <code className="text-brand-300 font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900">{user.referralCode}</code> and earn bonuses whenever a friend activates their account!
            </p>
            <Link
              href="/referrals"
              className="inline-block w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-900 font-extrabold text-xs text-center shadow-lg shadow-brand-500/20 transition-transform hover:scale-105"
            >
              Copy Referral Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
