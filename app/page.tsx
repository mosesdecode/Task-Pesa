'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  CheckSquare,
  PlaySquare,
  Share2,
  Users,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

import TopBannerCarousel from '@/components/TopBannerCarousel';
import SocialLinks from '@/components/SocialLinks';

export default function LandingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => {
        if (data.packages) setPackages(data.packages);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-12 overflow-x-hidden">
      {/* 0. TOP BANNER CAROUSEL */}
      <TopBannerCarousel />

      {/* 1. HERO SECTION */}
      <section className="relative pt-6 md:pt-12 pb-16 overflow-hidden">
        {/* Glow backdrop blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-emerald-500/15 to-transparent blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-brand-300 shadow-xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            <span>Kenya’s #1 Verified Digital Task & Micro-Work Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Turn Your Skills & Time Into <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">Digital Opportunities</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Complete legitimate digital tasks, participate in promotional campaigns, refer friends, and manage your earnings seamlessly from one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-base shadow-xl shadow-brand-500/25 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tasks"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-gray-200 font-bold text-base transition-all hover:border-slate-600 flex items-center justify-center gap-2"
            >
              Explore Available Tasks
            </Link>
          </div>

          {/* Social Links Bar */}
          <div className="pt-2">
            <SocialLinks />
          </div>

          {/* Stats Bar */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl glass-card text-center space-y-1">
              <p className="text-2xl font-black text-white">KES 200</p>
              <p className="text-xs text-gray-400 font-medium">Access Fee (Anti-Spam)</p>
            </div>
            <div className="p-4 rounded-2xl glass-card text-center space-y-1">
              <p className="text-2xl font-black text-brand-400">KES 500</p>
              <p className="text-xs text-gray-400 font-medium">Min Withdrawal Threshold</p>
            </div>
            <div className="p-4 rounded-2xl glass-card text-center space-y-1">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-xs text-gray-400 font-medium">M-Pesa Payout Verified</p>
            </div>
            <div className="p-4 rounded-2xl glass-card text-center space-y-1">
              <p className="text-2xl font-black text-emerald-400">48 Hours</p>
              <p className="text-xs text-gray-400 font-medium">Payout Rate Cooldown</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Simple Process</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white">How Task Mint Works</h3>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Get started in 6 straightforward steps and start earning from verified task campaigns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Create Your Account', desc: 'Sign up with your phone number, email, and safe password in under 60 seconds.' },
            { step: '02', title: 'Activate Account (KES 200)', desc: 'Pay the mandatory KES 200 access fee via Paystack to verify identity and prevent spam.' },
            { step: '03', title: 'Choose Available Tasks', desc: 'Browse Data Annotation, Sponsored Ads, WhatsApp promo campaigns, or microtasks.' },
            { step: '04', title: 'Complete Work', desc: 'Submit accurate annotations, watch required ad durations, or upload status screenshots.' },
            { step: '05', title: 'Track & Accumulate Rewards', desc: 'Watch your available and pending balances update automatically upon approval.' },
            { step: '06', title: 'Withdraw via M-Pesa', desc: 'Request direct Safaricom M-Pesa payouts once your available balance reaches KES 2,500.' },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-3xl glass-card glass-card-hover space-y-3 relative">
              <span className="text-4xl font-black text-brand-500/30 absolute top-4 right-6 font-mono">
                {item.step}
              </span>
              <h4 className="text-lg font-bold text-white pr-8">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TASK CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Diverse Micro-Work</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white">Task Categories</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: BrainCircuit, title: 'Data Annotation', desc: 'Label produce images, analyze text sentiment, and transcribe Swahili audio.' },
            { icon: CheckSquare, title: 'Microtasks', desc: 'Data categorization, content moderation, and text verification tasks.' },
            { icon: PlaySquare, title: 'Watch Ads', desc: 'Watch brand advertisement campaigns with anti-fraud timer checks.' },
            { icon: Share2, title: 'WhatsApp Promo', desc: 'Post campaign material to status and submit screenshot proof.' },
            { icon: Users, title: 'Referral Rewards', desc: 'Invite friends to activate and earn qualified referral bonuses.' },
          ].map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl glass-card glass-card-hover text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">{cat.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PACKAGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Platform Tiers</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white">Membership Packages</h3>
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full inline-block font-medium">
            ⚠️ Packages provide different task capacities and access levels. Packages are NOT investments and do NOT offer guaranteed returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-6 rounded-3xl glass-card flex flex-col justify-between space-y-6 relative ${
                pkg.name === 'GOLD' ? 'border-brand-500/50 glow-emerald' : ''
              }`}
            >
              {pkg.name === 'GOLD' && (
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-brand-500 text-dark-900 text-[10px] font-black uppercase tracking-wider">
                  Popular Choice
                </span>
              )}
              <div className="space-y-4">
                <h4 className="text-xl font-extrabold text-white">{pkg.name}</h4>
                <div>
                  <span className="text-3xl font-black text-white">KES {pkg.price}</span>
                  <span className="text-xs text-gray-400"> / {pkg.durationDays} days</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{pkg.description}</p>
                <ul className="space-y-2 pt-4 border-t border-slate-800 text-xs text-gray-300">
                  {pkg.features?.map((feat: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/register"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-dark-900 text-white font-extrabold text-xs transition-all text-center border border-slate-700"
              >
                Select {pkg.name} Package
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS (5 FAQs) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <HelpCircle className="w-4 h-4" /> Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-400">Everything you need to know about task completion, payouts, and account security.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: '1. How do I get started and why is there a KES 200 access fee?',
              a: 'Simply register an account and complete identity verification via Paystack. The KES 200 access fee acts as an anti-spam filter to prevent bot registrations and ensure only genuine workers access paid brand campaigns.',
            },
            {
              q: '2. How do I earn money on Task Mint?',
              a: 'You can earn by completing microtasks such as AI data annotation (produce image labeling, Swahili voice transcription, text sentiment classification), watching sponsored brand advertisements, sharing WhatsApp status promotional campaigns, and inviting friends via your referral code.',
            },
            {
              q: '3. What are the withdrawal rules and minimum payout threshold?',
              a: 'The minimum withdrawable balance is KES 2,500. Once your available balance reaches KES 2,500, you can request direct M-Pesa payouts. Withdrawals are processed weekly on Fridays between 9:00 AM and 5:00 PM EAT.',
            },
            {
              q: '4. How do membership packages work?',
              a: 'Membership packages (Bronze, Silver, Gold, Platinum) set your daily task limits, sponsored ad view capacities, and referral bonus rates. Upgrading your tier unlocks higher daily task limits. Packages are task allocation tiers, not financial investments.',
            },
            {
              q: '5. How do users and administrators change their login password?',
              a: 'Log into your account, open the user dropdown menu in the top right corner of the navigation bar, and select "Account & Verification" (or go to /profile). Administrators can also change their password directly in the Admin Control Panel under "Admin Security & Password".',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl glass-card border border-slate-800 transition-all cursor-pointer"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between font-bold text-white text-base">
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-brand-400 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {openFaq === idx && (
                <p className="mt-3 text-xs text-gray-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. M-PESA TRUST SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Smartphone className="w-4 h-4" />
              Safaricom M-Pesa Daraja Secured
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Fast & Convenient M-Pesa Payments
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              All account activation payments use instant STK Push technology directly on your mobile device. Approved withdrawals are disbursed every Friday directly to your verified M-Pesa number.
            </p>
          </div>
          <Link
            href="/register"
            className="px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-dark-900 font-extrabold text-sm shadow-xl shadow-brand-500/20 transition-transform hover:scale-105 shrink-0"
          >
            Create Your Account Today
          </Link>
        </div>
      </section>
    </div>
  );
}
