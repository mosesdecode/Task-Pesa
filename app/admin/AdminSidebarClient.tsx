'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Shield, Menu, X, LogOut, ChevronRight, Loader2,
  BarChart3, TrendingUp, CheckSquare, PlusCircle, Tag,
  FileText, Wallet, Users, PlaySquare, Sparkles, Lock, Package, Zap
} from 'lucide-react';

type AdminTab =
  | 'overview' | 'admin-actions' | 'earnings' | 'tasks' | 'add-task' | 'categories'
  | 'submissions' | 'users' | 'wallets' | 'packages' | 'adverts' | 'banners-social'
  | 'admin-settings' | 'audit-logs';

// navItems defined here — icon components cannot cross the server→client boundary
const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview',       label: 'Dashboard Overview',      icon: BarChart3  },
  { id: 'admin-actions',  label: 'Administrative Actions',  icon: Zap        },
  { id: 'earnings',       label: 'Earnings & Ledger',       icon: TrendingUp },
  { id: 'tasks',          label: 'Tasks Management',      icon: CheckSquare },
  { id: 'add-task',       label: 'Add New Task',          icon: PlusCircle },
  { id: 'categories',     label: 'Task Categories',       icon: Tag        },
  { id: 'submissions',    label: 'Submissions Review',    icon: FileText   },
  { id: 'users',          label: 'User Directory',        icon: Users      },
  { id: 'packages',       label: 'Membership Packages',   icon: Package    },
  { id: 'adverts',        label: 'Advert Campaigns',      icon: PlaySquare },
  { id: 'banners-social', label: 'Banners & Social',      icon: Sparkles   },
  { id: 'admin-settings', label: 'Security & Password',   icon: Lock       },
  { id: 'audit-logs',     label: 'System Audit Logs',     icon: Shield     },
];

export default function AdminSidebarClient({ adminEmail }: { adminEmail: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as AdminTab) || 'overview';

  // Matches page.tsx's handleLogout exactly:
  // AbortController 10s timeout, res.ok check, replace() only on success,
  // visible error message on failure, never navigates on a failed logout.
  const handleLogout = async () => {
    setLogoutError('');
    setLogoutLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error('Server error during logout');
      }
      sessionStorage.removeItem('taskmint_tab_active');
      window.location.replace('/admin/login');
    } catch (e: any) {
      clearTimeout(timeoutId);
      setLogoutLoading(false);
      setLogoutError("Couldn't log out. Check your connection and try again.");
    }
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    return (
      <Link
        href={`/admin?tab=${item.id}`}
        onClick={() => setMobileMenuOpen(false)}
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
          isActive
            ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
            : 'text-slate-400 hover:bg-dark-800 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 shrink-0" />
          {item.label}
        </span>
        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
      </Link>
    );
  };

  const LogoutButton = ({ label }: { label: string }) => (
    <div>
      {logoutError && (
        <p className="text-[10px] text-rose-400 px-3 pb-1">{logoutError}</p>
      )}
      <button
        onClick={handleLogout}
        disabled={logoutLoading}
        className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        <span>{logoutLoading ? 'Logging out...' : label}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-dark-900 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-dark-950 text-sm">TM</div>
          <span className="font-extrabold text-white text-base">
            TaskMint <span className="text-brand-400 text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">Admin</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-dark-800 text-slate-300 hover:text-white border border-dark-700 flex items-center gap-1.5 text-xs font-bold"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 bg-dark-900 border-r border-dark-800 flex flex-col transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <span className="font-extrabold text-white text-sm">Admin Panel</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => <NavLink key={item.id} item={item} />)}
        </nav>
        <div className="p-4 border-t border-dark-800">
          <LogoutButton label="Log Out" />
        </div>
      </div>

      {/* ── DESKTOP FIXED SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-dark-950 border-r border-dark-800/90 z-30 p-5 justify-between">
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="flex items-center gap-2.5 pb-5 border-b border-dark-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-dark-950 text-base shadow-md shadow-brand-500/20">TM</div>
            <div>
              <div className="font-extrabold text-white text-sm">TaskMint</div>
              <div className="text-xs text-brand-400 font-bold uppercase tracking-wider">Admin</div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => <NavLink key={item.id} item={item} />)}
          </nav>
        </div>
        <div className="pt-4 border-t border-dark-800 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-dark-800/50 text-xs text-slate-400 font-mono truncate">{adminEmail}</div>
          <LogoutButton label="Terminate Admin Session" />
        </div>
      </aside>
    </>
  );
}
