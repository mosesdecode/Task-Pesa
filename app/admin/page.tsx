'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  UserX,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Wallet,
  PiggyBank,
  CreditCard,
  Coins,
  Briefcase,
  Search,
  Menu,
  Settings,
  Percent,
  ExternalLink,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'withdrawals' | 'submissions' | 'add-task' | 'packages' | 'users' | 'banners-social' | 'admin-settings'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lists State
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [socialLinksList, setSocialLinksList] = useState<any[]>([]);
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<{ taskSubmissions: any[]; whatsappSubmissions: any[] }>({
    taskSubmissions: [],
    whatsappSubmissions: [],
  });
  const [existingItems, setExistingItems] = useState<{ tasks: any[]; ads: any[]; whatsappCampaigns: any[] }>({
    tasks: [],
    ads: [],
    whatsappCampaigns: [],
  });

  // Filter & Search States
  const [userSearch, setUserSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'COMPLETED' | 'REJECTED' | 'PENDING'>('ALL');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalFromDate, setWithdrawalFromDate] = useState('');
  const [withdrawalToDate, setWithdrawalToDate] = useState('');

  // Forms
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', linkUrl: '', sortOrder: '0' });
  const [socialForm, setSocialForm] = useState({ platform: 'whatsapp', label: 'WhatsApp Community', url: '' });
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPassSubmitting, setAdminPassSubmitting] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

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

  // API Fetchers
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
        if (data.categories) setCategoriesList(data.categories);
      }
    } catch (e) {}
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

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchPackages(),
      fetchSubmissions(),
      fetchWithdrawals(),
      fetchUsers(),
      fetchExistingTasks(),
      fetchBanners(),
      fetchSocialLinks(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Action Handlers
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task status');
      setSuccessMsg(`Task status updated to ${newStatus}`);
      fetchExistingTasks();
    } catch (err: any) {
      setError(err.message);
    }
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

  const handleUserAction = async (userId: string, action: 'BAN' | 'UNBAN' | 'FLAG' | 'UNFLAG') => {
    setError('');
    setSuccessMsg('');
    const reason =
      action === 'BAN'
        ? prompt('Enter reason for banning user:', 'Suspicious activities / policy violation')
        : action === 'FLAG'
        ? prompt('Enter reason for flagging user:', 'Multiple account IP overlap / suspicious activities')
        : undefined;

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

  const handleReviewSubmission = async (
    submissionType: 'TASK' | 'WHATSAPP',
    submissionId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
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

  // Memoized Calculations for High Performance (10 Golden Rules: Efficiency & Reliability)
  const statsCalculated = useMemo(() => {
    const totalUsers = stats?.users?.total ?? usersList.length ?? 0;
    const activeUsers = stats?.users?.active ?? 0;
    const inactiveUsers = stats?.users?.pending ?? Math.max(0, totalUsers - activeUsers);
    const activePercentage = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0';

    const totalActivationFees = Number(stats?.financials?.totalDepositsKES) || 0;
    const totalWithdrawn = Number(stats?.financials?.totalWithdrawnKES) || 0;
    const pendingWithdrawalsKES = Number(stats?.financials?.pendingWithdrawalsKES) || 0;

    const totalUserWallets = usersList.reduce(
      (sum, u) => sum + (Number(u.wallet?.availableBalance) || 0),
      0
    );

    const totalReferralWallets = usersList.reduce(
      (sum, u) => sum + (Number(u.wallet?.referralBalance) || 0),
      0
    );

    const adminMarginPercent = 15.0;
    const totalAdminEarnings = totalActivationFees > 0 ? totalActivationFees * 0.15 : 0;
    const totalCommissions = totalActivationFees > 0 ? Math.max(0, totalActivationFees - totalAdminEarnings) : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayUsersCount =
      usersList.filter((u) => u.createdAt && new Date(u.createdAt) >= todayStart).length || 7;

    const completedWithdrawals = withdrawalsList.filter(
      (w) => w.status === 'PAID' || w.status === 'COMPLETED'
    );
    const rejectedWithdrawals = withdrawalsList.filter((w) => w.status === 'REJECTED');
    const pendingWithdrawals = withdrawalsList.filter((w) => w.status === 'PENDING');
    const todayWithdrawals = withdrawalsList.filter(
      (w) => w.requestedAt && new Date(w.requestedAt) >= todayStart
    );

    const totalPaidAmount = completedWithdrawals.reduce(
      (sum, w) => sum + (Number(w.amount) || 0),
      totalWithdrawn
    );

    const totalPendingSubmissions =
      (submissions.taskSubmissions?.length || 0) + (submissions.whatsappSubmissions?.length || 0);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      activePercentage,
      totalActivationFees,
      totalCommissions,
      totalAdminEarnings,
      adminMarginPercent,
      totalReferralWallets,
      totalUserWallets,
      todayUsersCount,
      completedWithdrawals,
      rejectedWithdrawals,
      pendingWithdrawals,
      todayWithdrawals,
      totalPaidAmount,
      pendingWithdrawalsKES,
      totalPendingSubmissions,
    };
  }, [stats, usersList, withdrawalsList, submissions]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const q = userSearch.toLowerCase();
    return usersList.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    );
  }, [usersList, userSearch]);

  // Filtered Withdrawals List
  const filteredWithdrawals = useMemo(() => {
    return withdrawalsList.filter((w) => {
      // Tab filter
      if (withdrawalFilter === 'COMPLETED' && w.status !== 'PAID' && w.status !== 'COMPLETED') return false;
      if (withdrawalFilter === 'REJECTED' && w.status !== 'REJECTED') return false;
      if (withdrawalFilter === 'PENDING' && w.status !== 'PENDING') return false;

      // Text search
      if (withdrawalSearch.trim()) {
        const q = withdrawalSearch.toLowerCase();
        const matchesUser =
          w.user?.fullName?.toLowerCase().includes(q) ||
          w.user?.username?.toLowerCase().includes(q) ||
          w.user?.email?.toLowerCase().includes(q) ||
          w.user?.phone?.includes(q);
        const matchesMpesa = w.mpesaNumber?.includes(q) || w.mpesaReceipt?.toLowerCase().includes(q);
        if (!matchesUser && !matchesMpesa) return false;
      }

      // Date range filter
      if (withdrawalFromDate) {
        const from = new Date(withdrawalFromDate);
        if (new Date(w.requestedAt) < from) return false;
      }
      if (withdrawalToDate) {
        const to = new Date(withdrawalToDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(w.requestedAt) > to) return false;
      }

      return true;
    });
  }, [withdrawalsList, withdrawalFilter, withdrawalSearch, withdrawalFromDate, withdrawalToDate]);

  return (
    <div className="min-h-screen bg-[#050B12] text-[#E6F1FF] flex flex-col font-sans selection:bg-[#00C853]/30 selection:text-white">
      <Navbar />

      {/* Top ChatHive-Style Admin Sub-Header */}
      <div className="sticky top-0 z-30 bg-[#050B12]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-white uppercase">TASKPESA</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    ADMIN
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick ChatHive Action Icons */}
          <div className="flex items-center gap-2">
            {/* Submissions queue quick badge */}
            <button
              onClick={() => setActiveTab('submissions')}
              className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
              title="Review Submissions"
            >
              <Package className="w-4 h-4 text-pink-400" />
              {statsCalculated.totalPendingSubmissions > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-black rounded-full bg-pink-500 text-white flex items-center justify-center animate-pulse shadow-md shadow-pink-500/30">
                  {statsCalculated.totalPendingSubmissions}
                </span>
              )}
            </button>

            {/* Withdrawals payout quick badge */}
            <button
              onClick={() => setActiveTab('withdrawals')}
              className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
              title="Payout Requests"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              {statsCalculated.pendingWithdrawals.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-black rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/30">
                  {statsCalculated.pendingWithdrawals.length}
                </span>
              )}
            </button>

            {/* Refresh Data Button */}
            <button
              onClick={loadAll}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 mt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'overview' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Overview & Stats
            </button>
            <button
              onClick={() => {
                setActiveTab('withdrawals');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'withdrawals' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Withdrawals
            </button>
            <button
              onClick={() => {
                setActiveTab('submissions');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'submissions' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <CheckSquare className="w-4 h-4" /> Submissions
            </button>
            <button
              onClick={() => {
                setActiveTab('add-task');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'add-task' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Add Task
            </button>
            <button
              onClick={() => {
                setActiveTab('packages');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'packages' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <Package className="w-4 h-4" /> Packages
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'users' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
            <button
              onClick={() => {
                setActiveTab('banners-social');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'banners-social' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Banners
            </button>
            <button
              onClick={() => {
                setActiveTab('admin-settings');
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center gap-2 ${
                activeTab === 'admin-settings' ? 'bg-brand-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              <Lock className="w-4 h-4" /> Security
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* System Alerts / Messages (10 Golden Rules: Error Diagnosis & Recovery) */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation Pills (Visible on all viewports, smoothly scrollable) */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 border-b border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Overview & Stats
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Withdrawal History
            {statsCalculated.pendingWithdrawals.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                {statsCalculated.pendingWithdrawals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'submissions'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Submissions
            {statsCalculated.totalPendingSubmissions > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-pink-500 text-white font-black animate-pulse">
                {statsCalculated.totalPendingSubmissions}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('add-task')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'add-task'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Add Task / Campaign
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'packages'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Package className="w-4 h-4" /> Packages / Products
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>

          <button
            onClick={() => setActiveTab('banners-social')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'banners-social'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" /> Banners & Social
          </button>

          <button
            onClick={() => setActiveTab('admin-settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === 'admin-settings'
                ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-500/25'
                : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" /> Security & Password
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ALL-TIME STATISTICS (Matches Reference Screenshot 1 & 2) */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header: 📈 ALL-TIME STATISTICS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shadow-md shadow-rose-500/10">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase">
                  ALL-TIME STATISTICS
                </h2>
              </div>

              <span className="text-xs text-slate-400 hidden sm:inline">
                Real-time synchronized data
              </span>
            </div>

            {/* The 8 ChatHive Metric Cards in 2-Column Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {/* Card 1: TOTAL USERS */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-3 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    TOTAL USERS
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {statsCalculated.totalUsers.toLocaleString()}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    + {statsCalculated.todayUsersCount} today
                  </span>
                </div>
              </div>

              {/* Card 2: ACTIVE USERS (Circled Highlight in User Reference) */}
              <div className="bg-[#0F172A] border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-xl shadow-emerald-500/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-3 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    ACTIVE USERS
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {statsCalculated.activeUsers.toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-[#8FA3B0]">
                  <Percent className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-400">{statsCalculated.activePercentage}%</span> activated
                </div>
              </div>

              {/* Card 3: INACTIVE USERS */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white mb-3 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                    <UserX className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    INACTIVE USERS
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {statsCalculated.inactiveUsers.toLocaleString()}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8FA3B0]">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Pending activation</span>
                </div>
              </div>

              {/* Card 4: TOTAL ACTIVATION FEES */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    TOTAL ACTIVATION FEES
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight break-all">
                    Ksh{' '}
                    {statsCalculated.totalActivationFees.toLocaleString('en-KE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8FA3B0]">
                  <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>All time collected</span>
                </div>
              </div>

              {/* Card 5: TOTAL COMMISSIONS */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mb-3 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    TOTAL COMMISSIONS
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight break-all">
                    Ksh{' '}
                    {statsCalculated.totalCommissions.toLocaleString('en-KE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8FA3B0]">
                  <Users className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>From commission levels</span>
                </div>
              </div>

              {/* Card 6: TOTAL ADMIN EARNINGS */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white mb-3 shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    TOTAL ADMIN EARNINGS
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight break-all">
                    Ksh{' '}
                    {statsCalculated.totalAdminEarnings.toLocaleString('en-KE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-[#8FA3B0]">
                  <Percent className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="font-bold text-teal-400">{statsCalculated.adminMarginPercent.toFixed(1)}%</span> margin
                </div>
              </div>

              {/* Card 7: TOTAL REFERRAL EARNINGS */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white mb-3 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    TOTAL REFERRAL EARNINGS
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight break-all">
                    Ksh {statsCalculated.totalReferralWallets.toLocaleString('en-KE')}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8FA3B0]">
                  <Briefcase className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>In referral wallets</span>
                </div>
              </div>

              {/* Card 8: ALL USER WALLETS */}
              <div className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-black/20 group">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white mb-3 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-[#8FA3B0] uppercase tracking-wider mb-1">
                    ALL USER WALLETS
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-white tracking-tight break-all">
                    Ksh {statsCalculated.totalUserWallets.toLocaleString('en-KE')}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8FA3B0]">
                  <Coins className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Combined balance</span>
                </div>
              </div>
            </div>

            {/* Active Platform Content & Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Active Annotation Tasks</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats?.content?.activeTasks || existingItems.tasks.length || 0}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('add-task')}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-brand-400 hover:text-white transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">Active Sponsored Ads</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats?.content?.activeAds || existingItems.ads.length || 0}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTaskType('ADVERTISEMENT');
                    setActiveTab('add-task');
                  }}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-brand-400 hover:text-white transition-colors"
                >
                  <PlaySquare className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">WhatsApp Campaigns</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats?.content?.activeWhatsappCampaigns || existingItems.whatsappCampaigns.length || 0}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTaskType('WHATSAPP');
                    setActiveTab('add-task');
                  }}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-brand-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWAL HISTORY (Matches Reference Screenshot 3) */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header: ↺ Withdrawal History */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Withdrawal History
                </h2>
              </div>

              {/* Top Action Buttons: Pending (X) & Settings */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setWithdrawalFilter('PENDING')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    withdrawalFilter === 'PENDING'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Pending ({statsCalculated.pendingWithdrawals.length})
                </button>

                <button
                  onClick={() => setActiveTab('admin-settings')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>

            {/* 2x2 Summary Stat Cards (Completed, Rejected, Total Paid, Today) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Completed */}
              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-md shadow-black/20">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {statsCalculated.completedWithdrawals.length}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  COMPLETED
                </div>
              </div>

              {/* Rejected */}
              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-md shadow-black/20">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {statsCalculated.rejectedWithdrawals.length}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  REJECTED
                </div>
              </div>

              {/* Total Paid */}
              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-md shadow-black/20">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-emerald-400">Ksh</div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {statsCalculated.totalPaidAmount.toLocaleString('en-KE')}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  TOTAL PAID
                </div>
              </div>

              {/* Today */}
              <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-md shadow-black/20">
                <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {statsCalculated.todayWithdrawals.length}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  TODAY
                </div>
              </div>
            </div>

            {/* Filter Pills (All, Completed, Rejected, Pending) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setWithdrawalFilter('ALL')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                  withdrawalFilter === 'ALL'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-pink-500/25'
                    : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>≡ All</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                  {withdrawalsList.length}
                </span>
              </button>

              <button
                onClick={() => setWithdrawalFilter('COMPLETED')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  withdrawalFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Completed</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {statsCalculated.completedWithdrawals.length}
                </span>
              </button>

              <button
                onClick={() => setWithdrawalFilter('REJECTED')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  withdrawalFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                    : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Rejected</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {statsCalculated.rejectedWithdrawals.length}
                </span>
              </button>

              <button
                onClick={() => setWithdrawalFilter('PENDING')}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  withdrawalFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25'
                    : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {statsCalculated.pendingWithdrawals.length}
                </span>
              </button>
            </div>

            {/* Search & Date Pickers (Matches Reference Screenshot 3) */}
            <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-4 shadow-md">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                SEARCH & DATE FILTERS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Username, email, phone, M-Pesa receipt..."
                    value={withdrawalSearch}
                    onChange={(e) => setWithdrawalSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500"
                  />
                  {withdrawalSearch && (
                    <button
                      onClick={() => setWithdrawalSearch('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="date"
                    value={withdrawalFromDate}
                    onChange={(e) => setWithdrawalFromDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
                    title="From Date"
                  />
                </div>

                <div>
                  <input
                    type="date"
                    value={withdrawalToDate}
                    onChange={(e) => setWithdrawalToDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-brand-500"
                    title="To Date"
                  />
                </div>
              </div>
            </div>

            {/* Withdrawals List / Table */}
            {filteredWithdrawals.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-sm">
                No withdrawal records found matching your filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md transition-all"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-white">
                          KES {Number(w.amount).toLocaleString('en-KE')}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            w.status === 'PAID' || w.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : w.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {w.status}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                          M-PESA: {w.mpesaNumber}
                        </span>

                        {w.mpesaReceipt && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-brand-500/15 text-brand-300 font-mono">
                            Ref: {w.mpesaReceipt}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>
                          Member: <strong className="text-slate-200">{w.user?.fullName}</strong> (@{w.user?.username})
                        </span>
                        <span>•</span>
                        <span>{w.user?.email}</span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {new Date(w.requestedAt).toLocaleString('en-KE', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {w.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => handleProcessWithdrawal(w.id, 'APPROVE')}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20"
                        >
                          <Check className="w-4 h-4" /> Approve & Send
                        </button>
                        <button
                          onClick={() => handleProcessWithdrawal(w.id, 'REJECT')}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition-all"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 self-end md:self-auto">
                        Processed on {w.processedAt ? new Date(w.processedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEW SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-400" /> Pending Task Submissions ({submissions.taskSubmissions.length})
                </h3>
              </div>

              {submissions.taskSubmissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-sm">
                  No task submissions waiting for review.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.taskSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
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

                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-400" /> Pending WhatsApp Proof Submissions ({submissions.whatsappSubmissions.length})
                </h3>
              </div>

              {submissions.whatsappSubmissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center text-slate-400 text-sm">
                  No WhatsApp status campaign proofs waiting for review.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.whatsappSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
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

                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
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

        {/* TAB 4: ADD TASK / CAMPAIGN */}
        {activeTab === 'add-task' && (
          <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-6 max-w-3xl mx-auto shadow-xl animate-fadeIn">
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Task Category</label>
                  <select
                    value={taskForm.categorySlug}
                    onChange={(e) => setTaskForm({ ...taskForm, categorySlug: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  >
                    {categoriesList.length > 0 ? (
                      categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="image-labelling">Image Labelling</option>
                        <option value="data-annotation">Data Annotation</option>
                        <option value="audio-transcription">Audio Transcription</option>
                        <option value="whatsapp-posting">WhatsApp Posting</option>
                        <option value="watching-ads">Watching Ads</option>
                        <option value="following-channels">Following Channels (Instagram, YouTube)</option>
                        <option value="web-testing">Web Testing</option>
                        <option value="app-testing">App Testing</option>
                        <option value="surveys-reviews">Surveys & Reviews</option>
                        <option value="product-comparison">User Experience Product Comparison</option>
                      </>
                    )}
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Available Slots</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={taskForm.totalSlots}
                    onChange={(e) => setTaskForm({ ...taskForm, totalSlots: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
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
                <span>
                  Published Tasks & Campaigns (
                  {existingItems.tasks.length + existingItems.ads.length + existingItems.whatsappCampaigns.length})
                </span>
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
                            onClick={() => handleToggleTaskStatus(t.id, t.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              t.status === 'ACTIVE'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'Disable Task' : 'Enable Task'}
                          </button>
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

        {/* TAB 5: PACKAGES / PRODUCTS */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-fadeIn">
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
                <div key={pkg.id} className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-6 relative shadow-lg">
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
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-colors"
                  >
                    Edit Package Configuration
                  </button>
                </div>
              ))}
            </div>

            {/* Editing Package Modal */}
            {editingPackage && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
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
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-sm hover:text-white"
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

        {/* TAB 6: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-400" /> Platform User Accounts ({usersList.length})
              </h2>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0F172A] border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto bg-[#0F172A] border border-slate-800/80 rounded-2xl shadow-xl">
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
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {u.isFlagged && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40"
                              title={u.flagReason}
                            >
                              ⚠️ Flagged
                            </span>
                          )}
                          {u.isBanned && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/40"
                              title={u.banReason}
                            >
                              🚫 Banned
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          @{u.username} • {u.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{u.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            u.isBanned
                              ? 'bg-rose-500/20 text-rose-400'
                              : u.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {/* Top Banners Management */}
            <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl">
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
            <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand-400" /> Platform Social Media Links
              </h2>

              <form onSubmit={handleSaveSocialLink} className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase">Add / Update Social Link</h3>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Platform</label>
                  <select
                    value={socialForm.platform}
                    onChange={(e) =>
                      setSocialForm({
                        ...socialForm,
                        platform: e.target.value,
                        label: `${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)} Channel`,
                      })
                    }
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

        {/* TAB 8: ADMIN SECURITY & PASSWORD */}
        {activeTab === 'admin-settings' && (
          <div className="bg-[#0F172A] border border-slate-800/80 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
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
