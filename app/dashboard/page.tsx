'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/useMe';
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
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

  useEffect(() => {
    getMe().then((u) => {
      if (!u) {
        window.location.href = '/login?redirect=/dashboard';
        return;
      }
      setUser(u);

      fetch('/api/wallet')
        .then((res) => res.json())
        .then((wData) => {
          setWallet(wData.wallet);
          setRecentTransactions(wData.transactions || []);
        })
        .finally(() => setLoading(false));
    }).catch(() => {
      window.location.href = '/login?redirect=/dashboard';
    });
  }, [router]);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    setCheckInMessage('');

    try {
      const res = await fetch('/api/wallet/check-in', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        setCheckInMessage(data.error || 'Check-in failed');
        // Clear message after 3s
        setTimeout(() => setCheckInMessage(''), 3000);
        return;
      }

      // Success! Update wallet state
      setWallet((prev: any) => ({
        ...prev,
        coins: data.coins,
        lastCheckIn: data.lastCheckIn,
      }));
      setCheckInMessage(data.message);
      setTimeout(() => setCheckInMessage(''), 3000);
    } catch (err: any) {
      setCheckInMessage('Check-in failed');
      setTimeout(() => setCheckInMessage(''), 3000);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Banner carousel skeleton */}
        <Skeleton className="w-full h-36 rounded-3xl" />

        {/* Welcome banner skeleton */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 flex-1 relative z-10">
            <div className="flex items-center gap-2">
              <Skeleton className="w-28 h-6 rounded-full" />
            </div>
            <Skeleton className="w-64 h-10" />
            <Skeleton className="w-full max-w-sm h-4" />
          </div>
          <Skeleton className="w-36 h-12 rounded-2xl shrink-0" />
        </div>

        {/* 4 metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-9 h-9 rounded-xl" />
              </div>
              <Skeleton className="w-36 h-8" />
              <Skeleton className="w-44 h-3" />
            </div>
          ))}

        </div>

      </div>
    );
  }


  const availableBalance = wallet?.availableBalance || 0;
  const pendingBalance = wallet?.pendingBalance || 0;
  const totalEarned = wallet?.totalEarned || 0;
  const coins = wallet?.coins || 0;
  const lastCheckIn = wallet?.lastCheckIn ? new Date(wallet.lastCheckIn) : null;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const canCheckIn = !lastCheckIn || lastCheckIn < todayStart;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Carousel for Home/Dashboard */}
      <TopBannerCarousel placement="home" className="w-full" />

      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-lg dark:shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Account Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Jambo, {user.fullName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300">
            Welcome back to TaskMint Global — complete tasks, earn rewards, and track your growth.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10">
          {checkInMessage ? (
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-800 text-brand-600 dark:text-brand-300 text-xs font-bold text-center">
              {checkInMessage}
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={!canCheckIn || checkingIn}
              className={`px-6 py-3 rounded-2xl font-extrabold text-sm shadow-xl transition-all flex items-center gap-2 ${
                canCheckIn && !checkingIn
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/20 hover:scale-105'
                  : 'bg-slate-200 dark:bg-dark-800 text-slate-400 dark:text-slate-400 cursor-not-allowed opacity-80'
              }`}
            >
              <span className="text-lg">🪙</span>
              {checkingIn ? 'Checking in...' : canCheckIn ? 'Daily Check-in' : 'Checked In Today!'}
            </button>
          )}

          <Link
            href="/tasks"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Zap className="w-4 h-4" />
            Explore Tasks
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Earnings */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Total Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            KES {totalEarned.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-gray-400">Cumulative task rewards & bonuses</p>
        </div>

        {/* Available Balance */}
        <div className="p-6 rounded-3xl glass-card space-y-3 border-brand-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Available Balance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400">
            KES {availableBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-gray-400">Min Payout: KES 500</span>
            <Link href="/wallet" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              Withdraw →
            </Link>
          </div>
        </div>

        {/* Pending Earnings */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Pending Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            KES {pendingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-gray-400">Under quality review or weekly payout</p>
        </div>

        {/* Account Status Card */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Account Status</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {user.emailVerified ? 'Verified' : 'Active'}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-gray-400">Email: Verified</span>
            <Link href="/profile" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              View Profile →
            </Link>
          </div>
        </div>

        {/* Coins Balance Card */}
        <div className="p-6 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Coin Balance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
              🪙
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {coins.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-gray-400">50 Coins = 10 KES</span>
            <Link href="/wallet" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              Redeem →
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
}
