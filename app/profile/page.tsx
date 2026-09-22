'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Key,
  ShieldCheck,
  Camera,
  Upload,
  Clock,
  RotateCcw,
  Calendar,
  Check
} from 'lucide-react';
import { normalizeKenyanPhone, isSafaricomNumber, formatKenyanPhoneDisplay } from '@/lib/phone';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'VERIFICATION' | 'SECURITY'>('PROFILE');

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Phone OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) {
        router.push('/login?redirect=/profile');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFirstName(data.user.firstName || '');
        setSurname(data.user.surname || '');
        setProfilePhoto(data.user.profilePhoto || '');
        setPhoneInput(data.user.phone || '');
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Handle direct file upload for profile photo
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds the 5MB size limit. Please choose a smaller photo.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setError('');
    setSuccessMsg('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setProfilePhoto(data.profilePhoto);
      setUser((prev: any) => ({ ...prev, profilePhoto: data.profilePhoto }));
      setSuccessMsg('Profile photo uploaded and updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Avatar upload failed');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Save Profile Details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          surname,
          profilePhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setSuccessMsg('Profile information updated successfully!');
      fetchUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Send Safaricom OTP
  const handleSendPhoneOtp = async () => {
    setError('');
    setSuccessMsg('');

    const targetPhone = phoneInput.trim() || user?.phone;
    if (!targetPhone) {
      setError('Please provide a valid Safaricom phone number to verify.');
      return;
    }

    const normalized = normalizeKenyanPhone(targetPhone);
    if (!isSafaricomNumber(normalized)) {
      setError('Please enter a valid Kenyan Safaricom phone number (07XX or 011X).');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.retryAfter) {
          setCooldown(data.retryAfter);
        }
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      setOtpSent(true);
      setCooldown(60); // 60-second cooldown
      setSuccessMsg(`Verification code sent to ${formatKenyanPhoneDisplay(normalized)}!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify Phone OTP
  const handleVerifyPhoneOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit numeric verification code.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Please check the code.');
      }

      setSuccessMsg(data.message || 'Phone number verified successfully!');
      setOtpSent(false);
      setOtpCode('');
      fetchUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
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

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans pb-16">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <UserIcon className="w-5 h-5" />
            </div>
            Account & Profile Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal profile, Safaricom phone verification, and security credentials.
          </p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in duration-200">
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Profile Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-dark-900/80 border border-dark-800 rounded-3xl p-6 relative backdrop-blur-md shadow-xl">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
                  Loading account details...
                </div>
              ) : user ? (
                <div>
                  <div className="flex flex-col items-center text-center pb-6 border-b border-dark-800">
                    {/* Avatar Container with Upload Trigger */}
                    <div className="relative group mb-4">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-xl shadow-brand-500/20 overflow-hidden">
                        <div className="w-full h-full bg-dark-950 rounded-[14px] flex items-center justify-center font-extrabold text-white text-2xl overflow-hidden relative">
                          {avatarPreview || user.profilePhoto ? (
                            <img
                              src={avatarPreview || user.profilePhoto}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-brand-400 font-mono text-2xl font-bold">
                              {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                              {(user.surname?.[0] || user.username?.[1] || 'M').toUpperCase()}
                            </span>
                          )}

                          {/* Hover Upload Overlay */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-dark-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-brand-400"
                          >
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Change</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Upload Icon Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        title="Upload profile picture"
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-400 text-dark-950 flex items-center justify-center shadow-lg border-2 border-dark-900 transition-all cursor-pointer"
                      >
                        {uploadingAvatar ? (
                          <div className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarSelect}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden"
                      />
                    </div>

                    <h2 className="text-xl font-bold text-white">
                      {user.firstName ? `${user.firstName} ${user.surname}` : user.fullName}
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">@{user.username}</p>

                    {/* Account Role & Status Badges (No Bronze/Silver/Gold tiers) */}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        }`}
                      >
                        {user.role} ACCOUNT
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {user.status}
                      </span>
                    </div>

                    {/* Direct Upload Button for Clarity */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="mt-4 px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-slate-200 border border-dark-700 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-brand-400" />
                      {uploadingAvatar ? 'Uploading Image...' : 'Upload New Photo'}
                    </button>
                  </div>

                  {/* Summary Details */}
                  <div className="mt-6 space-y-3.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                      </span>
                      <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                        <span className="font-semibold text-white truncate" title={user.email}>
                          {user.email}
                        </span>
                        {user.emailVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Safaricom Phone Number
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-white">
                          {formatKenyanPhoneDisplay(user.phone)}
                        </span>
                        {user.phoneVerified ? (
                          <span className="flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Check className="w-3 h-3 mr-0.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member Since
                      </span>
                      <span className="font-medium text-slate-300">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No profile data available.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Main Settings Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 p-1 bg-dark-900 rounded-2xl border border-dark-800">
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'PROFILE'
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Personal Details
              </button>
              <button
                onClick={() => setActiveTab('VERIFICATION')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'VERIFICATION'
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Phone Verification
              </button>
              <button
                onClick={() => setActiveTab('SECURITY')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'SECURITY'
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Security & Password
              </button>
            </div>

            {/* TAB 1: PERSONAL DETAILS */}
            {activeTab === 'PROFILE' && (
              <div className="bg-dark-900/80 border border-dark-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
                <div className="border-b border-dark-800 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-brand-400" /> Edit Profile Details
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your display name and public account representation.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white focus:outline-none focus:border-brand-500 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                        Surname
                      </label>
                      <input
                        type="text"
                        placeholder="Kamau"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white focus:outline-none focus:border-brand-500 text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                      Username (Read Only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.username || ''}
                      className="w-full px-4 py-3 rounded-xl bg-dark-950/50 border border-dark-800/60 text-slate-500 font-mono text-sm cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                      Registered Email (Read Only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-4 py-3 rounded-xl bg-dark-950/50 border border-dark-800/60 text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-dark-950 font-bold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Saving Profile...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: SAFARICOM PHONE VERIFICATION */}
            {activeTab === 'VERIFICATION' && (
              <div className="bg-dark-900/80 border border-dark-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
                <div className="border-b border-dark-800 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" /> Safaricom Phone Verification
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Verify your Kenyan Safaricom phone number (07XX / 011X) to enable instant M-Pesa withdrawals and task payouts.
                      </p>
                    </div>

                    {user?.phoneVerified && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {user?.phoneVerified ? (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-base text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      Safaricom Phone Number Verified
                    </div>
                    <p className="text-xs text-slate-300">
                      Your registered phone <strong className="font-mono text-white">{formatKenyanPhoneDisplay(user.phone)}</strong> is confirmed and verified. You have full access to M-Pesa automatic withdrawals and marketplace rewards.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step 1: Input / Confirm Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                        Kenyan Safaricom Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            placeholder="0712345678 or 0112345678"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            disabled={otpSent}
                            className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white font-mono focus:outline-none focus:border-brand-500 text-sm pl-11"
                          />
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>

                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={sendingOtp || cooldown > 0}
                          className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs shrink-0 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/10"
                        >
                          {sendingOtp ? (
                            'Sending Code...'
                          ) : cooldown > 0 ? (
                            <>
                              <Clock className="w-3.5 h-3.5" /> Wait {cooldown}s
                            </>
                          ) : (
                            'Send Verification Code'
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Accepts standard Safaricom formats: 07XXXXXXXX, 011XXXXXXX, or +254XXXXXXXXX.
                      </p>
                    </div>

                    {/* Step 2: Enter 6-digit OTP */}
                    {otpSent && (
                      <div className="p-5 rounded-2xl bg-brand-500/5 border border-brand-500/30 space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                            Enter 6-Digit Verification Code
                          </span>
                          {cooldown > 0 ? (
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-brand-400" /> Resend in {cooldown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendPhoneOtp}
                              disabled={sendingOtp}
                              className="text-xs text-brand-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <RotateCcw className="w-3 h-3" /> Resend Code
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="••••••"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white font-mono tracking-[0.5em] text-center text-xl font-bold focus:outline-none focus:border-brand-500"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPhoneOtp}
                            disabled={verifyingOtp || otpCode.length !== 6}
                            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold text-sm shrink-0 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                          >
                            {verifyingOtp ? 'Verifying...' : 'Verify Phone'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SECURITY & PASSWORD */}
            {activeTab === 'SECURITY' && (
              <div className="bg-dark-900/80 border border-dark-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-800">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Change Login Password</h2>
                    <p className="text-xs text-slate-400">
                      Update your account password with strong credentials.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Current Password with Show/Hide Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white focus:outline-none focus:border-brand-500 text-sm pr-11 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password with Show/Hide Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                      New Password (min 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white focus:outline-none focus:border-brand-500 text-sm pr-11 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password with Show/Hide Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white focus:outline-none focus:border-brand-500 text-sm pr-11 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-dark-800 hover:bg-brand-500 hover:text-dark-950 border border-dark-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-dark-950/50"
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
    </div>
  );
}
