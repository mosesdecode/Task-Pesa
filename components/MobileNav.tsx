'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Wallet, Users, User, ShieldCheck } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Referrals', href: '/referrals', icon: Users },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Admin', href: '/admin', icon: ShieldCheck },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-slate-800/80 px-2 py-1.5">
      <div className="flex items-center justify-around">
        {navItems
          .filter((item) => item.href !== '/admin')
          .map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand-400 font-bold bg-brand-500/10 border border-brand-500/20'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-gray-400'}`} />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
