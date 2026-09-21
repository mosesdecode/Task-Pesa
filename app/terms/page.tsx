'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  ClipboardCheck,
  Users,
  AlertTriangle,
  Gavel,
  Lock,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon?: any;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-4 border-b border-slate-800/60 pb-10">
    <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2.5">
      {Icon && <Icon className="w-6 h-6 shrink-0" />}
      {title}
    </h2>
    <div className="text-gray-300 leading-relaxed space-y-3 text-sm sm:text-base">
      {children}
    </div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
      {/* Hero Header */}
      <header className="relative py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Terms &amp;{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">
              Conditions
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            By registering or using the TaskMint platform, you agree to be bound
            by these Terms and Conditions. Please read them carefully.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Last updated: September 2026
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* 1. About the Platform */}
        <Section icon={Smartphone} title="1. About TaskMint">
          <p>
            TaskMint is Kenya's digital micro-task marketplace that connects
            users with short, legitimate digital work including data annotation,
            image labeling, WhatsApp promotional campaigns, ad viewing, surveys,
            web and app testing, and transcription tasks.
          </p>
          <p>
            TaskMint is <strong className="text-white">not</strong> an investment
            scheme, a pyramid scheme, or a get-rich-quick program. Earnings are
            derived solely from completing approved tasks and qualifying referrals.
          </p>
        </Section>

        {/* 2. Account Activation */}
        <Section icon={CreditCard} title="2. Account Activation">
          <p>
            New accounts require a one-time activation fee of{' '}
            <strong className="text-emerald-400">KES 200</strong>. This fee:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Grants full access to the task marketplace.</li>
            <li>Enables your unique referral link and referral commissions.</li>
            <li>Acts as an identity filter to prevent bot and duplicate accounts.</li>
            <li>
              Is <strong className="text-white">non-refundable</strong> once your
              account is activated.
            </li>
          </ul>
          <p>
            Payment is processed securely via{' '}
            <strong className="text-white">Paystack</strong> and supports M-Pesa
            STK Push, card, and bank transfer.
          </p>
        </Section>

        {/* 3. Eligibility */}
        <Section icon={ClipboardCheck} title="3. User Eligibility">
          <p>To use the TaskMint platform you must:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Be at least 18 years of age.</li>
            <li>Be a resident of Kenya with access to a Safaricom M-Pesa line.</li>
            <li>Provide accurate personal information during registration.</li>
            <li>Not hold more than one (1) TaskMint account.</li>
          </ul>
        </Section>

        {/* 4. Tasks & Submissions */}
        <Section icon={ClipboardCheck} title="4. Tasks, Submissions &amp; Rewards">
          <p>
            Tasks are created and managed by the TaskMint admin team. Each task
            specifies its title, description, category, reward amount (KES), and
            any proof requirements (e.g., screenshot upload).
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              Submissions are reviewed by admin before rewards are credited.
            </li>
            <li>
              Admin may approve or reject submissions at their discretion. Rejected
              submissions will be notified to the user.
            </li>
            <li>
              Fraudulent, duplicate, or low-quality submissions will be rejected
              and may result in account suspension.
            </li>
            <li>Task availability and reward amounts may change without notice.</li>
            <li>
              Rewards are credited as a <em>pending balance</em> until admin
              approves the payout.
            </li>
          </ul>
          <p>
            TaskMint reserves the right to disable, edit, or delete any task at
            any time.
          </p>
        </Section>

        {/* 5. Withdrawals */}
        <Section icon={ArrowRight} title="5. Withdrawal Policy">
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              Minimum withdrawal amount:{' '}
              <strong className="text-emerald-400">KES 500</strong>.
            </li>
            <li>
              Maximum of{' '}
              <strong className="text-white">one (1) withdrawal</strong> per{' '}
              <strong className="text-white">48 hours</strong>.
            </li>
            <li>
              A transaction fee of{' '}
              <strong className="text-emerald-400">KES 10</strong> is deducted
              from each withdrawal.
            </li>
            <li>
              Users must verify their Safaricom phone number via OTP before
              submitting a withdrawal request.
            </li>
            <li>
              You must have completed at least{' '}
              <strong className="text-white">10 tasks</strong>, have an account
              aged at least <strong className="text-white">5 days</strong>, have at
              least <strong className="text-white">5 active referrals</strong>, and
              your balance must not be 100% sourced from referrals alone.
            </li>
            <li>
              Withdrawals remain as <em>pending</em> until admin manually processes
              and approves the payout, after which the status changes to{' '}
              <em>paid</em>.
            </li>
            <li>
              TaskMint does not guarantee same-day payments. Processing time may
              vary.
            </li>
          </ul>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm">
              <strong>No Refunds on Activation:</strong> The KES 200 activation
              fee is non-refundable under any circumstances, including account
              bans for rule violations.
            </p>
          </div>
        </Section>

        {/* 6. Referral Program */}
        <Section icon={Users} title="6. Referral Program">
          <p>
            Users earn{' '}
            <strong className="text-emerald-400">KES 10</strong> for each
            friend they refer who successfully registers and activates their
            account. Referral commissions are credited directly to your wallet.
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              Self-referrals or fraudulent referrals (fake accounts) are strictly
              prohibited and will result in account termination.
            </li>
            <li>
              A balance composed entirely (100%) of referral earnings is not
              eligible for withdrawal until task earnings are also included.
            </li>
          </ul>
        </Section>

        {/* 7. Prohibited Conduct */}
        <Section icon={AlertTriangle} title="7. Prohibited Conduct">
          <p>The following actions are strictly prohibited:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Creating multiple accounts to exploit referral bonuses.</li>
            <li>Submitting false, fabricated, or duplicate task proofs.</li>
            <li>Using bots, scripts, or automated tools to complete tasks.</li>
            <li>Sharing account credentials with others.</li>
            <li>
              Any attempt to hack, manipulate, or exploit platform systems.
            </li>
            <li>
              Posting spam, abusive content, or misleading promotional material.
            </li>
          </ul>
          <p>
            Violations may result in immediate account suspension, forfeiture of
            pending earnings, and a permanent ban.
          </p>
        </Section>

        {/* 8. Account Suspension & Termination */}
        <Section icon={Lock} title="8. Account Suspension &amp; Termination">
          <p>
            TaskMint reserves the right to suspend or permanently ban any account
            that:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Violates these Terms &amp; Conditions.</li>
            <li>Exhibits suspicious or fraudulent activity as flagged by admin.</li>
            <li>Attempts to circumvent withdrawal rules or referral policies.</li>
          </ul>
          <p>
            Banned users forfeit all pending balances and lose access to the
            platform permanently. No refunds of the activation fee will be
            issued.
          </p>
        </Section>

        {/* 9. Earnings Disclaimer */}
        <Section icon={AlertTriangle} title="9. Earnings Disclaimer">
          <p>
            TaskMint does <strong className="text-white">not</strong> guarantee
            any specific level of income. Earnings depend entirely on:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Task availability at any given time.</li>
            <li>Quality and accuracy of your submissions.</li>
            <li>Number of active referrals.</li>
            <li>Admin review and approval decisions.</li>
          </ul>
          <p>
            Any income figures shared publicly by TaskMint or its users are
            examples only and not representative of average results.
          </p>
        </Section>

        {/* 10. Privacy */}
        <Section icon={ShieldCheck} title="10. Privacy &amp; Data">
          <p>
            Your personal data (name, phone number, M-Pesa details) is used
            solely for the purpose of operating the platform and processing
            payments. We do not sell or share your data with third parties except
            as required by Kenyan law.
          </p>
          <p>
            For full details, see our{' '}
            <Link href="/privacy" className="text-emerald-400 underline hover:text-emerald-300">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        {/* 11. Governing Law */}
        <Section icon={Gavel} title="11. Governing Law">
          <p>
            These Terms and Conditions are governed by and construed in
            accordance with the laws of the{' '}
            <strong className="text-white">Republic of Kenya</strong>. Any
            disputes arising from the use of TaskMint shall be subject to the
            exclusive jurisdiction of the courts of Nairobi, Kenya.
          </p>
        </Section>

        {/* 12. Changes to Terms */}
        <Section icon={ClipboardCheck} title="12. Changes to These Terms">
          <p>
            TaskMint reserves the right to modify these Terms at any time.
            Continued use of the platform after changes are posted constitutes
            acceptance of the updated Terms. It is your responsibility to review
            this page periodically.
          </p>
        </Section>

        {/* Footer CTA */}
        <div className="pt-8 text-center space-y-4">
          <p className="text-gray-400 text-sm">
            For questions about these Terms, contact us via the{' '}
            <Link href="/support" className="text-emerald-400 underline hover:text-emerald-300">
              Support page
            </Link>
            .
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
          >
            Return to Home
          </Link>
          <p className="text-xs text-gray-600 pt-4">
            © {new Date().getFullYear()} TaskMint Platform (Kenya). All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
