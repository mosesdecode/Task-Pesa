'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Shield,
  PlusCircle,
  Package,
  CheckSquare,
  DollarSign,
  Users,
  BarChart3,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Zap,
  RefreshCw,
  Eye,
  FileText,
  Share2,
  PlaySquare,
  Layers,
  Trash2,
  Lock,
  Key,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'add-task' | 'packages' | 'submissions' | 'withdrawals' | 'users' | 'banners-social' | 'admin-settings'>('overview');
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [socialLinksList, setSocialLinksList] = useState<any[]>([]);

  // Banner form state
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', linkUrl: '', sortOrder: '0' });
  const [socialForm, setSocialForm] = useState({ platform: 'whatsapp', label: 'WhatsApp Community', url: '' });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Change Password state
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPassSubmitting, setAdminPassSubmitting] = useState(false);

  // Existing items state
  const [existingItems, setExistingItems] = useState<{ tasks: any[]; ads: any[]; whatsappCampaigns: any[] }>({
    tasks: [],
    ads: [],
    whatsappCampaigns: [],
  });

  // Packages state
  const [packagesList, setPackagesList] = useState<any[]>([]);

  // Submissions state
  const [submissions, setSubmissions] = useState<{ taskSubmissions: any[]; whatsappSubmissions: any[] }>({
    taskSubmissions: [],
    whatsappSubmissions: [],
  });

  // Withdrawals state
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Form states for creating task
  const [taskType, setTaskType] = useState<'DATA_ANNOTATION' | 'MICROTASK' | 'ADVERTISEMENT' | 'WHATSAPP'>('DATA_ANNOTATION');
  const [taskForm, setTaskForm] = useState({
    title: '',
    categorySlug: 'data-annotation',
    reward: '150',
    instructions: '',
    proofRequired: 'Submit text, link, or screenshot proof',
    durationSeconds: '120',
    totalSlots: '100',
    minPackageTier: 'BRONZE',
    mediaUrl: '',
    advertiser: '',
    campaignName: '',
    caption: '',
  });

  // Editing package state
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Access denied or error fetching stats');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/admin/packages');
      if (res.ok) {
        const data = await res.json();
        setPackagesList(data.packages || []);
      }
    } catch (e) {}
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {}
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawalsList(data.withdrawals || []);
      }
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {}
  };

  const fetchExistingTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks');
      if (res.ok) {
        const data = await res.json();
        setExistingItems({
          tasks: data.tasks || [],
          ads: data.ads || [],
          whatsappCampaigns: data.whatsappCampaigns || [],
        });
      }
    } catch (e) {}
  };

  const handleDeleteItem = async (id: string, type: 'TASK' | 'AD' | 'WHATSAPP') => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/tasks?id=${id}&type=${type}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');
      setSuccessMsg(data.message || 'Item deleted successfully!');
      fetchExistingTasks();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        setBannersList(data.banners || []);
      }
    } catch (e) {}
  };

  const fetchSocialLinks = async () => {
    try {
      const res = await fetch('/api/admin/social-links');
      if (res.ok) {
        const data = await res.json();
        setSocialLinksList(data.links || []);
      }
    } catch (e) {}
  };

  const handleUserAction = async (userId: string, action: 'BAN' | 'UNBAN' | 'FLAG' | 'UNFLAG') => {
    setError('');
    setSuccessMsg('');
    const reason = action === 'BAN' ? prompt('Enter reason for banning user:', 'Suspicious activities / policy violation') :
                   action === 'FLAG' ? prompt('Enter reason for flagging user:', 'Multiple account IP overlap / suspicious activities') : undefined;

    if ((action === 'BAN' || action === 'FLAG') && !reason) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, banReason: reason, flagReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setSuccessMsg(data.message);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save banner');
      setSuccessMsg('Banner created successfully!');
      setBannerForm({ title: '', imageUrl: '', linkUrl: '', sortOrder: '0' });
      fetchBanners();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    try {
      await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      fetchBanners();
    } catch (e) {}
  };

  const handleSaveSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save social link');
      setSuccessMsg('Social link updated successfully!');
      fetchSocialLinks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteSocialLink = async (id: string) => {
    if (!confirm('Delete social link?')) return;
    try {
      await fetch(`/api/admin/social-links?id=${id}`, { method: 'DELETE' });
      fetchSocialLinks();
    } catch (e) {}
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchStats();
      await fetchPackages();
      await fetchSubmissions();
      await fetchWithdrawals();
      await fetchUsers();
      await fetchExistingTasks();
      await fetchBanners();
      await fetchSocialLinks();
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: taskType, ...taskForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      setSuccessMsg(`Task "${taskForm.title || taskForm.campaignName}" successfully published!`);
      setTaskForm({
        title: '',
        categorySlug: 'data-annotation',
        reward: '150',
        instructions: '',
        proofRequired: 'Submit text, link, or screenshot proof',
        durationSeconds: '120',
        totalSlots: '100',
        minPackageTier: 'BRONZE',
        mediaUrl: '',
        advertiser: '',
        campaignName: '',
        caption: '',
      });
      fetchStats();
      fetchExistingTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPackage),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update package');

      setSuccessMsg(data.message || 'Package updated successfully!');
      setEditingPackage(null);
      fetchPackages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReviewSubmission = async (submissionType: 'TASK' | 'WHATSAPP', submissionId: string, action: 'APPROVE' | 'REJECT') => {
    setError('');
    setSuccessMsg('');
    const adminNotes = action === 'APPROVE' ? 'Approved by Admin' : 'Quality requirement not met';

    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionType, submissionId, action, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');

      setSuccessMsg(data.message);
      fetchSubmissions();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal action failed');

      setSuccessMsg(data.message);
      fetchWithdrawals();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (adminNewPassword !== adminConfirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (adminNewPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setAdminPassSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: adminCurrentPassword,
          newPassword: adminNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setSuccessMsg(data.message || 'Admin password updated successfully!');
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdminPassSubmitting(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> ADMIN CONTROL PANEL
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Administration</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage tasks, membership packages/products, review submissions, process M-Pesa payouts, and view system metrics.
            </p>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchStats();
              fetchPackages();
              fetchSubmissions();
              fetchWithdrawals();
              fetchUsers();
              setLoading(false);
            }}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Notifications / Alerts */}
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

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-8 border-b border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Overview & Stats
          </button>

          <button
            onClick={() => setActiveTab('add-task')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'add-task'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Add New Task / Campaign
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'packages'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" /> Packages / Products
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'submissions'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Review Submissions
            {(submissions.taskSubmissions.length > 0 || submissions.whatsappSubmissions.length > 0) && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-bold animate-pulse">
                {submissions.taskSubmissions.length + submissions.whatsappSubmissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Payout Requests
            {withdrawalsList.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-amber-500 text-black font-bold">
                {withdrawalsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>

          <button
            onClick={() => setActiveTab('banners-social')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'banners-social'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" /> Banners & Social Links
          </button>

          <button
            onClick={() => setActiveTab('admin-settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'admin-settings'
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" /> Admin Security & Password
          </button>
        </div>

        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {stats ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Members</span>
                      <Users className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-white">{stats.users?.total || 0}</div>
                    <div className="mt-2 text-xs text-slate-400 flex gap-2">
                      <span className="text-emerald-400">{stats.users?.active || 0} active</span> •{' '}
                      <span className="text-amber-400">{stats.users?.pending || 0} pending</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue / Deposits</span>
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400">
                      KES {(stats.financials?.totalDepositsKES || 0).toLocaleString('en-KE')}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {stats.financials?.totalDepositsCount || 0} M-Pesa STK transactions
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Paid Payouts</span>
                      <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-white">
                      KES {(stats.financials?.totalWithdrawnKES || 0).toLocaleString('en-KE')}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Pending: KES {(stats.financials?.pendingWithdrawalsKES || 0).toLocaleString('en-KE')}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Pending Submissions</span>
                      <CheckSquare className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-400">
                      {stats.content?.pendingSubmissions || 0}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Tasks awaiting QA verification
                    </div>
                  </div>
                </div>

                {/* Content Stats Summary */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-400" /> Active Platform Campaigns & Content
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Active Annotation Tasks</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.content?.activeTasks || 0}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">Active Video Ads</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.content?.activeAds || 0}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400">WhatsApp Campaigns</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.content?.activeWhatsappCampaigns || 0}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">Loading admin statistics...</div>
            )}
          </div>
        )}

        {/* TAB 2: ADD NEW TASK / CAMPAIGN */}
        {activeTab === 'add-task' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-brand-400" /> Create & Publish New Task
            </h2>

            {/* Task Type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setTaskType('DATA_ANNOTATION')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                  taskType === 'DATA_ANNOTATION'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-5 h-5" /> Data Annotation
              </button>

              <button
                type="button"
                onClick={() => setTaskType('MICROTASK')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                  taskType === 'MICROTASK'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckSquare className="w-5 h-5" /> Microtask
              </button>

              <button
                type="button"
                onClick={() => setTaskType('ADVERTISEMENT')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                  taskType === 'ADVERTISEMENT'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <PlaySquare className="w-5 h-5" /> Sponsored Ad
              </button>

              <button
                type="button"
                onClick={() => setTaskType('WHATSAPP')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all flex flex-col items-center gap-1.5 ${
                  taskType === 'WHATSAPP'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Share2 className="w-5 h-5" /> WhatsApp Campaign
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {taskType === 'WHATSAPP' ? 'Campaign Title / Name' : 'Task Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    taskType === 'WHATSAPP'
                      ? 'e.g. TaskPesa Product Launch Promo'
                      : 'e.g. Sentiment Classification & Image Labeling'
                  }
                  value={taskType === 'WHATSAPP' ? taskForm.campaignName : taskForm.title}
                  onChange={(e) =>
                    taskType === 'WHATSAPP'
                      ? setTaskForm({ ...taskForm, campaignName: e.target.value, title: e.target.value })
                      : setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Reward (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={taskForm.reward}
                    onChange={(e) => setTaskForm({ ...taskForm, reward: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Minimum Package Required</label>
                  <select
                    value={taskForm.minPackageTier}
                    onChange={(e) => setTaskForm({ ...taskForm, minPackageTier: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  >
                    <option value="BRONZE">BRONZE (KES 100)</option>
                    <option value="SILVER">SILVER (KES 500)</option>
                    <option value="GOLD">GOLD (KES 1,500)</option>
                    <option value="PLATINUM">PLATINUM (KES 3,000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Proof Required Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Upload screenshot of completed survey or enter transaction ID"
                  value={taskForm.proofRequired}
                  onChange={(e) => setTaskForm({ ...taskForm, proofRequired: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              {taskType === 'ADVERTISEMENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Advertiser Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Safaricom PLC"
                    value={taskForm.advertiser}
                    onChange={(e) => setTaskForm({ ...taskForm, advertiser: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              )}

              {(taskType === 'ADVERTISEMENT' || taskType === 'WHATSAPP') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Media / Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={taskForm.mediaUrl}
                    onChange={(e) => setTaskForm({ ...taskForm, mediaUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              )}

              {taskType === 'WHATSAPP' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">WhatsApp Status Caption</label>
                  <textarea
                    rows={2}
                    placeholder="Copy-pasteable caption for workers..."
                    value={taskForm.caption}
                    onChange={(e) => setTaskForm({ ...taskForm, caption: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Instructions</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Clear instructions for workers completing this task..."
                  value={taskForm.instructions}
                  onChange={(e) => setTaskForm({ ...taskForm, instructions: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Available Slots / Capacity</label>
                  <input
                    type="number"
                    value={taskForm.totalSlots}
                    onChange={(e) => setTaskForm({ ...taskForm, totalSlots: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={taskForm.durationSeconds}
                    onChange={(e) => setTaskForm({ ...taskForm, durationSeconds: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 text-white font-bold text-sm hover:from-brand-500 hover:to-emerald-400 shadow-lg shadow-brand-500/20 transition-all"
              >
                Publish Task to Marketplace
              </button>
            </form>

            {/* List of Active Published Tasks & Campaigns */}
            <div className="mt-12 pt-8 border-t border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center justify-between">
                <span>Published Tasks & Campaigns ({existingItems.tasks.length + existingItems.ads.length + existingItems.whatsappCampaigns.length})</span>
              </h3>

              {/* Data & Microtasks */}
              {existingItems.tasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Annotation & Microtasks</h4>
                  <div className="space-y-2">
                    {existingItems.tasks.map((t) => (
                      <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white text-sm">{t.title}</div>
                          <div className="text-slate-400 mt-0.5">
                            Category: {t.category?.name || 'Data'} • Tier: <span className="text-brand-300 font-semibold">{t.minPackageTier}</span> • Slots: {t.remainingSlots}/{t.totalSlots}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400 text-sm">KES {t.reward}</span>
                          <button
                            onClick={() => handleDeleteItem(t.id, 'TASK')}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsored Ads */}
              {existingItems.ads.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sponsored Video & Banner Ads</h4>
                  <div className="space-y-2">
                    {existingItems.ads.map((ad) => (
                      <div key={ad.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white text-sm">{ad.title}</div>
                          <div className="text-slate-400 mt-0.5">
                            Advertiser: {ad.advertiser} • Duration: {ad.durationSeconds}s • Tier: <span className="text-brand-300 font-semibold">{ad.minPackageTier}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400 text-sm">KES {ad.reward}</span>
                          <button
                            onClick={() => handleDeleteItem(ad.id, 'AD')}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Ad"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Campaigns */}
              {existingItems.whatsappCampaigns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp Status Campaigns</h4>
                  <div className="space-y-2">
                    {existingItems.whatsappCampaigns.map((w) => (
                      <div key={w.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white text-sm">{w.campaignName}</div>
                          <div className="text-slate-400 mt-0.5">
                            Max Participants: {w.maxParticipants} • Tier: <span className="text-brand-300 font-semibold">{w.minPackageTier}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-400 text-sm">KES {w.reward}</span>
                          <button
                            onClick={() => handleDeleteItem(w.id, 'WHATSAPP')}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PACKAGES / PRODUCTS MANAGEMENT */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-400" /> Membership Packages & Products
                </h2>
                <p className="text-slate-400 text-xs mt-1">Configure pricing, daily task allocations, and referral bonuses.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packagesList.map((pkg) => (
                <div key={pkg.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                      {pkg.name} TIER
                    </span>
                    <span className="text-2xl font-extrabold text-white">KES {pkg.price.toLocaleString('en-KE')}</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 mb-6">
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Daily Task Allocation:</span>
                      <span className="font-semibold text-white">{pkg.taskLimitDaily} tasks/day</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Sponsored Ads Limit:</span>
                      <span className="font-semibold text-white">{pkg.watchAdsLimit} ads/day</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">WhatsApp Tasks / Week:</span>
                      <span className="font-semibold text-white">{pkg.whatsappTasksLimit} tasks</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Referral Reward Bonus:</span>
                      <span className="font-semibold text-emerald-400">KES {pkg.referralBonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Validity Duration:</span>
                      <span className="font-semibold text-white">{pkg.durationDays} Days</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPackage({ ...pkg })}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    Edit Package Configuration
                  </button>
                </div>
              ))}
            </div>

            {/* Editing Package Modal */}
            {editingPackage && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Edit {editingPackage.name} Package</h3>
                    <button onClick={() => setEditingPackage(null)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdatePackage} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">Package Price (KES)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPackage.price}
                        onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Daily Task Limit</label>
                        <input
                          type="number"
                          value={editingPackage.taskLimitDaily}
                          onChange={(e) => setEditingPackage({ ...editingPackage, taskLimitDaily: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Daily Ad Limit</label>
                        <input
                          type="number"
                          value={editingPackage.watchAdsLimit}
                          onChange={(e) => setEditingPackage({ ...editingPackage, watchAdsLimit: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">WhatsApp Tasks / Week</label>
                        <input
                          type="number"
                          value={editingPackage.whatsappTasksLimit}
                          onChange={(e) => setEditingPackage({ ...editingPackage, whatsappTasksLimit: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Referral Reward (KES)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingPackage.referralBonus}
                          onChange={(e) => setEditingPackage({ ...editingPackage, referralBonus: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm"
                      >
                        Save Package Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPackage(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVIEW SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-8">
            {/* Task Submissions Queue */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" /> Pending Task Submissions ({submissions.taskSubmissions.length})
              </h3>

              {submissions.taskSubmissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                  No task submissions waiting for review.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.taskSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{sub.task?.title}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-brand-500/20 text-brand-300 font-semibold">
                            KES {sub.task?.reward}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Submitted by: <strong className="text-slate-200">{sub.user?.fullName}</strong> (@{sub.user?.username}) • Phone: {sub.user?.phone}
                        </p>
                        <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-w-xl">
                          {sub.responsePayloadJson || 'No text payload submitted'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => handleReviewSubmission('TASK', sub.id, 'APPROVE')}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all"
                        >
                          <Check className="w-4 h-4" /> Approve & Credit
                        </button>
                        <button
                          onClick={() => handleReviewSubmission('TASK', sub.id, 'REJECT')}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition-all"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WhatsApp Submissions Queue */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" /> Pending WhatsApp Proof Submissions ({submissions.whatsappSubmissions.length})
              </h3>

              {submissions.whatsappSubmissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                  No WhatsApp status campaign proofs waiting for review.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.whatsappSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{sub.campaign?.campaignName}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 font-semibold">
                            KES {sub.campaign?.reward}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Submitted by: <strong className="text-slate-200">{sub.user?.fullName}</strong> (@{sub.user?.username})
                        </p>
                        {sub.screenshotUrl && (
                          <a
                            href={sub.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-brand-400 hover:text-brand-300 text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Screenshot Proof
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => handleReviewSubmission('WHATSAPP', sub.id, 'APPROVE')}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all"
                        >
                          <Check className="w-4 h-4" /> Approve & Credit
                        </button>
                        <button
                          onClick={() => handleReviewSubmission('WHATSAPP', sub.id, 'REJECT')}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition-all"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: PAYOUT REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Pending M-Pesa Withdrawal Requests ({withdrawalsList.length})
            </h2>

            {withdrawalsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                No pending withdrawal requests.
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawalsList.map((w) => (
                  <div key={w.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold text-white">KES {w.amount.toLocaleString('en-KE')}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 font-semibold">
                          M-PESA: {w.mpesaNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Member: <strong className="text-slate-200">{w.user?.fullName}</strong> (@{w.user?.username}) • Email: {w.user?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => handleProcessWithdrawal(w.id, 'APPROVE')}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all"
                      >
                        <Check className="w-4 h-4" /> Mark Paid / Complete
                      </button>
                      <button
                        onClick={() => handleProcessWithdrawal(w.id, 'REJECT')}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition-all"
                      >
                        <X className="w-4 h-4" /> Reject & Refund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-400" /> Platform User Accounts ({usersList.length})
              </h2>

              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-500 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto bg-slate-900/80 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Phone / M-Pesa</th>
                    <th className="px-4 py-3">Status / Flags</th>
                    <th className="px-4 py-3">Package Tier</th>
                    <th className="px-4 py-3 text-right">Available Balance</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {u.isFlagged && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40" title={u.flagReason}>
                              ⚠️ Flagged
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40" title={u.banReason}>
                              🚫 Banned
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">@{u.username} • {u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${u.isBanned ? 'bg-rose-500/20 text-rose-400' : u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {u.isBanned ? 'BANNED' : u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-brand-300">{u.package?.name || 'BRONZE'}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-white">
                        KES {(u.wallet?.availableBalance || 0).toLocaleString('en-KE')}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => handleUserAction(u.id, u.isBanned ? 'UNBAN' : 'BAN')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                            u.isBanned
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                        <button
                          onClick={() => handleUserAction(u.id, u.isFlagged ? 'UNFLAG' : 'FLAG')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                            u.isFlagged
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                          }`}
                        >
                          {u.isFlagged ? 'Unflag' : 'Flag Suspect'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: BANNERS & SOCIAL LINKS */}
        {activeTab === 'banners-social' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Banners Management */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Homepage Top Banners (~5s Slideshow)
              </h2>

              <form onSubmit={handleCreateBanner} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase">Add New Banner Slide</h3>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Banner Title / Text</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🔥 Earn KES 500 Daily completing simple verified tasks!"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Target Link URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="/tasks or https://..."
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all"
                >
                  Add Banner Slide
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Configured Slides ({bannersList.length})</h3>
                {bannersList.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{b.title}</p>
                      {b.linkUrl && <p className="text-[10px] text-brand-400">{b.linkUrl}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links Management */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand-400" /> Platform Social Media Links
              </h2>

              <form onSubmit={handleSaveSocialLink} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase">Add / Update Social Link</h3>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Platform</label>
                  <select
                    value={socialForm.platform}
                    onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value, label: `${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)} Channel` })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="facebook">Facebook</option>
                    <option value="telegram">Telegram</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Label Text</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp Official Group"
                    value={socialForm.label}
                    onChange={(e) => setSocialForm({ ...socialForm, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Full URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://chat.whatsapp.com/..."
                    value={socialForm.url}
                    onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold transition-all"
                >
                  Save Social Link
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Active Social Links ({socialLinksList.length})</h3>
                {socialLinksList.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold uppercase text-[10px] mr-2">
                        {s.platform}
                      </span>
                      <span className="font-bold text-white">{s.label}</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{s.url}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSocialLink(s.id)}
                      className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ADMIN SECURITY & PASSWORD */}
        {activeTab === 'admin-settings' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Change Administrator Password</h2>
                <p className="text-xs text-slate-400">
                  Update your admin account password to secure system access.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangeAdminPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Current Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current admin password"
                  value={adminCurrentPassword}
                  onChange={(e) => setAdminCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  New Admin Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new admin password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={adminPassSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {adminPassSubmitting ? 'Updating Admin Password...' : 'Update Admin Password'}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
