'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Key,
  ShieldCheck,
  Zap,
  Camera,
  MessageSquare
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'SECURITY' | 'PROFILE'>('PROFILE');

  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile form states
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  // OTP state
  const [otpType, setOtpType] = useState<'EMAIL' | 'PHONE' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // UI state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFirstName(data.user.firstName || '');
        setSurname(data.user.surname || '');
        setProfilePhoto(data.user.profilePhoto || '');
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setSuccessMsg(data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, surname, profilePhoto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setSuccessMsg(data.message || 'Profile updated successfully!');
      fetchUser(); // Refresh user data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async (type: 'EMAIL' | 'PHONE') => {
    setError('');
    setSuccessMsg('');
    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setSuccessMsg(data.message);
      setOtpType(type);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setSuccessMsg('');
    setVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: otpType, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setSuccessMsg(data.message);
      setOtpType(null);
      setOtpCode('');
      fetchUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UserIcon className="w-7 h-7 text-brand-400" /> Account & Security Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal profile details, account security, and verify your identities.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Account Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative">
              {loading ? (
                <div className="py-8 text-center text-slate-400 text-sm">Loading user details...</div>
              ) : user ? (
                <div>
                  <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800">
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-xl shadow-brand-500/20 mb-3 group">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-white text-2xl overflow-hidden relative">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user.username?.substring(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">{user.firstName ? `${user.firstName} ${user.surname}` : user.fullName}</h2>
                    <p className="text-xs text-slate-400">@{user.username}</p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        user.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      }`}>
                        {user.role} ACCOUNT
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        user.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-white truncate max-w-[120px]" title={user.email}>
                          {user.email}
                        </span>
                        {user.emailVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> M-Pesa
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-white font-mono">{user.phone}</span>
                        {user.phoneVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-brand-400" /> Package Tier
                      </span>
                      <span className="font-bold text-brand-300">{user.package?.name || 'BRONZE'} TIER</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No profile data available.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Content Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'PROFILE' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Edit Profile & Verification
              </button>
              <button
                onClick={() => setActiveTab('SECURITY')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'SECURITY' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                Security & Password
              </button>
            </div>

            {activeTab === 'PROFILE' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8">
                {/* OTP Verification Section */}
                <div className="space-y-4 pb-6 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-400" /> Identity Verification
                  </h3>
                  
                  {(!user?.emailVerified || !user?.phoneVerified) && !otpType && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!user?.emailVerified && (
                        <button
                          onClick={() => handleSendOtp('EMAIL')}
                          disabled={sendingOtp}
                          className="p-4 rounded-xl border border-slate-700 hover:border-brand-500 bg-slate-800/50 flex flex-col items-center justify-center gap-2 transition-all"
                        >
                          <Mail className="w-6 h-6 text-brand-400" />
                          <span className="text-sm font-bold text-white">Verify Email</span>
                          <span className="text-xs text-slate-400">Receive OTP via Email</span>
                        </button>
                      )}
                      {!user?.phoneVerified && (
                        <button
                          onClick={() => handleSendOtp('PHONE')}
                          disabled={sendingOtp}
                          className="p-4 rounded-xl border border-slate-700 hover:brand-500 bg-slate-800/50 flex flex-col items-center justify-center gap-2 transition-all"
                        >
                          <MessageSquare className="w-6 h-6 text-emerald-400" />
                          <span className="text-sm font-bold text-white">Verify Phone</span>
                          <span className="text-xs text-slate-400">Receive OTP via SMS</span>
                        </button>
                      )}
                    </div>
                  )}

                  {otpType && (
                    <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-4">
                      <div className="text-sm text-gray-300">
                        Enter the 6-digit code sent to your <strong>{otpType.toLowerCase()}</strong>.
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono tracking-[0.5em] text-center text-lg focus:outline-none focus:border-brand-500"
                        />
                        <button
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otpCode.length !== 6}
                          className="px-6 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-900 font-bold disabled:opacity-50"
                        >
                          {verifyingOtp ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      <button onClick={() => setOtpType(null)} className="text-xs text-brand-400 hover:underline">Cancel</button>
                    </div>
                  )}

                  {user?.emailVerified && user?.phoneVerified && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-3 text-sm font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      All verification steps completed.
                    </div>
                  )}
                </div>

                {/* Edit Profile Section */}
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-brand-400" /> Personal Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Surname</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Profile Photo URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://imgur.com/my-avatar.jpg"
                        value={profilePhoto}
                        onChange={(e) => setProfilePhoto(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm pl-10"
                      />
                      <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? 'Saving Profile...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'SECURITY' && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Change Login Password</h2>
                    <p className="text-xs text-slate-400">
                      Update your account password. Works for both standard users and platform administrators.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        required
                        placeholder="Enter your existing password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-dark-900 border border-slate-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {submitting ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
