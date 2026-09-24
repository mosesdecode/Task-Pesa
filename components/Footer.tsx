'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Smartphone } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/admin/login') return null;
  return (
    <footer className="bg-dark-900 border-t border-slate-800/80 pt-12 pb-24 md:pb-12 mt-20 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-white text-sm">
                TM
              </div>
              <span className="font-extrabold text-xl text-white">
                Task<span className="text-brand-400">Mint</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Kenya's premier digital task and micro-work platform. Complete legitimate data annotation, surveys, and content verification securely.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tasks" className="hover:text-brand-400 transition-colors">
                  Tasks
                </Link>
              </li>
              <li>
                <Link href="/packages" className="hover:text-brand-400 transition-colors">
                  Task Packages
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-brand-400 transition-colors">
                  M-Pesa Withdrawals
                </Link>
              </li>
              <li>
                <Link href="/referrals" className="hover:text-brand-400 transition-colors">
                  Referral Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="hover:text-brand-400 transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-brand-400 transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Security &amp; Trust</h4>
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium text-xs">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Anti-Fraud Protected
              </div>
              <p className="text-xs text-gray-400">
                All payouts run through verified M-Pesa server-side audit trails.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} TaskMint Platform. All rights reserved.</p>
          <p className="text-gray-500">Secure Task &amp; Payout Platform</p>
        </div>
      </div>
    </footer>
  );
}
