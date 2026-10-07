'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  Clock,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import TopBannerCarousel from '@/components/TopBannerCarousel';
import { Skeleton } from '@/components/Skeleton';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          window.location.href = '/login?redirect=/dashboard';
          return;
        }
        setUser(data.user);

        // Fetch wallet details
        fetch('/api/wallet')
          .then((res) => res.json())
          .then((wData) => {
            setWallet(wData.wallet);
            setRecentTransactions(wData.transactions || []);
          })
          .finally(() => setLoading(false));
      })
      .catch(() => {
        window.location.href = '/login?redirect=/dashboard';
      });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Banner carousel skeleton — matches TopBannerCarousel height */}
        <Skeleton className="w-full h-36 rounded-3xl" />

        {/* Welcome banner skeleton — mirrors gradient card with badge chips, title, desc, button */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 flex-1 relative z-10">
            {/* Two badge chips side-by-side (Phone Verified + Account Active) */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-28 h-6 rounded-full" />
              <Skeleton className="w-28 h-6 rounded-full" />
            </div>
            {/* Large greeting h1 */}
            <Skeleton className="w-64 h-10" />
            {/* Sub-description line */}
            <Skeleton className="w-full max-w-sm h-4" />
          </div>
          {/* "Explore Tasks" button */}
          <Skeleton className="w-36 h-12 rounded-2xl shrink-0" />
        </div>

        {/* 4 metric cards — each mirrors its own real bottom-row shape */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Total Earnings — single sub-text line */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="w-36 h-8" />
            <Skeleton className="w-44 h-3" />
          </div>

          {/* Card 2: Available Balance — two-item bottom row (Min Payout + Withdraw link) */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="w-36 h-8" />
            <div className="flex items-center justify-between">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>

          {/* Card 3: Pending Earnings — single sub-text line */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-28 h-3" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="w-36 h-8" />
            <Skeleton className="w-44 h-3" />
          </div>

          {/* Card 4: Account Status — two-item bottom row (Payouts: Enabled + View Profile link) */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
            <Skeleton className="w-24 h-7" />
            <div className="flex items-center justify-between">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>

        </div>

      </div>
    );
  }


  const availableBalance = wallet?.availableBalance || 0;
  const pendingBalance = wallet?.pendingBalance || 0;
  const totalEarned = wallet?.totalEarned || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Carousel for Home/Dashboard */}
      <TopBannerCarousel placement="home" className="w-full" />

      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Account Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Jambo, {user.fullName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-300">
            Welcome back to TaskMint Global — complete tasks, earn rewards, and track your growth.
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

      {/* Metric Cards Grid */}
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
          <p className="text-[11px] text-gray-400">Under quality review or weekly payout</p>
        </div>

        {/* Account Status Card */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Status</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-white">
            {user.phoneVerified ? 'Verified' : 'Unverified'}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Payouts: Enabled</span>
            <Link href="/profile" className="text-brand-400 font-bold hover:underline">
              {user.phoneVerified ? 'View Profile →' : 'Verify Phone →'}
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
}
