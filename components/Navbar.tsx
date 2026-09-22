'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wallet,
  CheckCircle2,
  Bell,
  User as UserIcon,
  Shield,
  LogOut,
  Zap,
  LayoutDashboard,
  Target,
  Award,
  Share2,
  ShieldAlert
} from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Task Market', href: '/tasks', icon: Target },
  { name: 'Packages', href: '/packages', icon: Award },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Refer & Earn', href: '/referrals', icon: Share2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUser();
    fetchNotifications();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-400 fill-brand-400/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                Task<span className="text-brand-400">Mint</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  KE
                </span>
              </span>
              <span className="text-[10px] text-gray-400 -mt-1 font-medium tracking-wide">
                Digital Micro-Work
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-400'
                        : 'text-gray-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
              
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname === '/admin'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-amber-500/70 hover:text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </div>
          )}

            {/* Right Action & User Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Balance Pill - Hidden for Admin */}
                {user.role !== 'ADMIN' && (
                  <Link
                    href="/wallet"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold hover:border-brand-500/40 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-brand-400" />
                    <span className="text-gray-200">
                      KES {(user.wallet?.availableBalance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </span>
                  </Link>
                )}

                {/* Notifications Bell */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400 ring-4 ring-dark-900 animate-ping" />
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-white text-xs">
                      {user.username?.substring(0, 2).toUpperCase()}
                    </div>
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-sm font-semibold text-white">{user.fullName}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                            {user.package?.name || 'BRONZE'} TIER
                          </span>
                        </div>
                      </div>

                      {user.role !== 'ADMIN' && (
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800/70 rounded-xl"
                        >
                          <UserIcon className="w-4 h-4 text-brand-400" />
                          User Dashboard
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800/70 rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4 text-brand-400" />
                        Account & Verification
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-xl font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Control Panel
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
