'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('PAYMENT');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');

      setNotice(data.message);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (err: any) {
      setNotice(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Help & Support Desk</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Get assistance with payments, M-Pesa withdrawals, task verification, or account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Ticket Form */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            Submit Support Ticket
          </h3>

          {notice && (
            <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">
              {notice}
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="PAYMENT">M-Pesa / Activation Issue</option>
                <option value="WITHDRAWAL">Withdrawal Issue</option>
                <option value="TASK_VERIFICATION">Task Verification Issue</option>
                <option value="ACCOUNT">Account & Profile Settings</option>
                <option value="OTHER">General Inquiry</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Subject</label>
              <input
                type="text"
                required
                placeholder="Brief summary of your request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Detailed Message</label>
              <textarea
                rows={4}
                required
                placeholder="Provide M-Pesa reference or task details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 text-white font-black text-sm shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>

        {/* Existing Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-400" />
            Your Open Support Tickets
          </h3>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="p-8 rounded-3xl glass-card text-center text-gray-500 text-sm">
                No active support tickets found.
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-6 rounded-3xl glass-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-brand-400 border border-slate-700">
                      {t.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 text-[10px] font-bold">
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base">{t.subject}</h4>
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {t.messages?.map((m: any) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-900 text-xs text-gray-300 space-y-1">
                        <p className="font-bold text-brand-400">{m.sender?.fullName}</p>
                        <p>{m.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5 FAQs SECTION */}
      <div className="pt-8 border-t border-slate-800 space-y-6">
        <div className="text-center sm:text-left space-y-1">
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-brand-400" /> Frequently Asked Questions (FAQs)
          </h3>
          <p className="text-xs text-gray-400">Quick answers to common questions about TaskPesa platform usage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass-card space-y-2">
            <h4 className="font-bold text-white text-sm">1. How do I get started and why is there a KES 100 access fee?</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Create an account and complete verification via M-Pesa STK Push. The KES 100 fee serves as an anti-spam identity check to maintain genuine worker campaign access.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2">
            <h4 className="font-bold text-white text-sm">2. How do I earn money on TaskPesa?</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Earn through AI data annotation (image labeling, Swahili voice transcription), watching brand advertisements, posting WhatsApp status campaigns, and referral bonuses.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2">
            <h4 className="font-bold text-white text-sm">3. What are the withdrawal rules and minimum threshold?</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              The minimum withdrawable balance is KES 2,500. Request direct Safaricom M-Pesa payouts once reached. Disbursed weekly on Fridays between 9:00 AM and 5:00 PM EAT.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2">
            <h4 className="font-bold text-white text-sm">4. How do membership packages work?</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Membership tiers (Bronze, Silver, Gold, Platinum) set your daily task submission capacity, ad limits, and referral rates. They are task capacity tiers, not financial investments.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-2 md:col-span-2">
            <h4 className="font-bold text-white text-sm">5. How do users and administrators change their login password?</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Click your avatar/name in the navigation menu, select "Account & Verification" (or go to /profile), and fill in your current and new password. Admins can also change password inside /admin under "Admin Security & Password".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
