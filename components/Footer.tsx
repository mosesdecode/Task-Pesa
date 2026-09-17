'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Smartphone, Lock } from 'lucide-react';

export default function Footer() {
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
              Kenya’s premier digital task marketplace & micro-work platform. Complete legitimate annotation, sponsored campaigns, and microtasks securely.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-brand-400 font-medium">
                <Smartphone className="w-3.5 h-3.5" />
                M-Pesa Daraja Verified
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tasks" className="hover:text-brand-400 transition-colors">
                  Task Marketplace
                </Link>
              </li>
              <li>
                <Link href="/packages" className="hover:text-brand-400 transition-colors">
                  Membership Packages
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
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal & Disclaimers</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="hover:text-brand-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-brand-400 transition-colors">
                  Earnings Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-brand-400 transition-colors">
                  Refund & Activation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Security & Trust</h4>
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2 text-white font-medium text-xs">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Anti-Fraud Protected
              </div>
              <p className="text-xs text-gray-400">
                All payouts run through automated M-Pesa server-side verification and audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40 text-xs text-gray-400 mb-8 leading-relaxed">
          <strong className="text-gray-300 font-semibold block mb-1">Notice & Earnings Disclaimer:</strong>
          Task availability and earnings are not guaranteed. Rewards depend on successfully completing eligible tasks and meeting campaign requirements. The KES 100 activation fee grants access to the platform and prevents duplicate spam accounts. Task Mint is not an investment scheme.
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Task Mint Platform (Kenya). All rights reserved.</p>
          <p className="text-gray-500">Built with Next.js, Prisma & Safaricom Daraja API</p>
        </div>
      </div>
    </footer>
  );
}
