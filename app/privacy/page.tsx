'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Shield,
  Lock,
  Eye,
  Database,
  FileCheck,
  UserCheck,
  Server,
  Key,
  Smartphone,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'August 11, 2026';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Shield className="w-4 h-4 text-brand-400" />
            Kenya Data Protection Act (2019) Compliant
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Privacy Policy & Data Protection
          </h1>
          
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            At TaskMint, we respect your privacy and are committed to safeguarding your personal data, transaction history, and digital work submissions.
          </p>

          <div className="text-xs text-slate-500 font-mono">
            Last Updated: <span className="text-slate-300 font-semibold">{lastUpdated}</span>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">256-Bit Encrypted Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Passwords are salted and hashed using bcrypt. All communication uses SSL/TLS transport encryption.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">No PII Sales</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never sell your phone number, email address, or personal identifiers to third-party marketers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Full User Rights</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You maintain the right to inspect, update, or request erasure of your personal data at any time.
            </p>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-10 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">1</span>
              Introduction & Legal Scope
            </h2>
            <p>
              This Privacy Policy explains how <strong>TaskMint Digital Solutions</strong> (“TaskMint”, “we”, “our”, or “us”) collects, uses, stores, and protects your personal data when you access or use our web application, micro-work marketplace, Safaricom M-Pesa payment portal, and related services.
            </p>
            <p>
              By creating an account, paying the activation fee, or participating in tasks on TaskMint, you explicitly consent to the data practices described in this policy, formulated in adherence to the <strong>Kenya Data Protection Act, 2019</strong> and international data safety guidelines.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">2</span>
              Information We Collect
            </h2>
            <p>We collect only the minimum necessary information required to operate a secure digital work marketplace:</p>
            
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <strong className="text-white font-semibold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-400" /> A. Personal Identification Details
                </strong>
                <p className="text-xs text-slate-400">
                  Full name, preferred username, email address, and verified Safaricom M-Pesa phone number provided during registration.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <strong className="text-white font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> B. M-Pesa & Financial Transaction Records
                </strong>
                <p className="text-xs text-slate-400">
                  M-Pesa STK push transaction reference codes (CheckoutRequestID), payment confirmation timestamps, wallet balance history, and payout withdrawal request logs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <strong className="text-white font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-400" /> C. Task Submissions & Proof Materials
                </strong>
                <p className="text-xs text-slate-400">
                  User responses submitted for AI data annotation, ad viewing timestamps, and uploaded screenshot proof files for WhatsApp promotional campaign verification.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                <strong className="text-white font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" /> D. Technical Security & Anti-Fraud Logs
                </strong>
                <p className="text-xs text-slate-400">
                  IP addresses, browser header specifications, login timestamps, and referral code usage to detect and prevent automated bot activity or duplicate accounts.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">3</span>
              How We Use Your Personal Data
            </h2>
            <p>Your data is processed strictly for legitimate operational purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs pl-2">
              <li>Verifying user identity and processing KES 200 account activations via Paystack.</li>
              <li>Reviewing, validating, and approving worker task submissions for correct reward allocation.</li>
              <li>Processing weekly M-Pesa withdrawal payouts to verified member numbers.</li>
              <li>Preventing fraudulent submissions, duplicate account abuse, and automated spamming.</li>
              <li>Providing responsive customer helpdesk and support ticket resolutions.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">4</span>
              Data Sharing & Third-Party Services
            </h2>
            <p>
              TaskMint does <strong>NOT</strong> sell, rent, or trade your personal information to marketing brokers. We share data only with trusted partners necessary for core platform function:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs pl-2">
              <li>
                <strong>Safaricom PLC (M-Pesa Daraja API):</strong> Phone numbers and transaction amounts are transmitted over encrypted HTTPS to execute STK push billing and payout disbursements.
              </li>
              <li>
                <strong>Campaign Sponsors & Advertisers:</strong> Advertisers receive aggregated, anonymized task metrics (e.g. "500 verified views completed") without any personal PII exposed.
              </li>
              <li>
                <strong>Legal Authorities:</strong> We may disclose data if mandated by a valid court order or official law enforcement inquiry under Kenyan law.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">5</span>
              Data Storage & Security Measures
            </h2>
            <p>
              We implement industry-standard administrative, physical, and technical safeguards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white block mb-1">bcrypt Hashed Passwords</strong>
                Passwords are never stored in plain text. Salted bcrypt hashing ensures password privacy.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white block mb-1">SSL/TLS Transport Encryption</strong>
                All network communication between your web browser and TaskMint servers is encrypted via TLS 1.3.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white block mb-1">JWT Session Tokens</strong>
                Secure HTTP-only cookies prevent unauthorized cross-site scripting (XSS) session hijacking.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-white block mb-1">Database Access Controls</strong>
                Strict role-based access control restricts database access to authorized platform systems only.
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">6</span>
              Your Rights under the Kenya Data Protection Act
            </h2>
            <p>As a TaskMint user, you possess the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs pl-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data held in our database.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal details.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your account and personal identifiers (subject to statutory financial audit retention rules).</li>
              <li><strong>Right to Object:</strong> Object to automated processing or algorithmic account flags.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-300 text-xs font-mono font-bold flex items-center justify-center">7</span>
              Contact Our Data Protection Team
            </h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data rights, please contact our Data Protection Officer:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">TaskMint Data Protection Office</p>
              <p className="text-slate-400">Email: <span className="text-brand-300">privacy@taskmint.co.ke</span></p>
              <p className="text-slate-400">Support Desk: <span className="text-slate-300">Submit a ticket via /support</span></p>
              <p className="text-slate-400">Nairobi, Kenya</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
