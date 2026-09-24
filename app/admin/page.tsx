'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  EyeOff,
  FileText,
  Share2,
  PlaySquare,
  Layers,
  Trash2,
  Lock,
  Key,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Wallet,
  Coins,
  Briefcase,
  Search,
  Menu,
  Settings,
  ExternalLink,
  ChevronRight,
  Phone,
  LogOut,
  Upload,
  Tag,
  Radio,
  Loader2,
} from 'lucide-react';
import { formatKenyanPhoneDisplay } from '@/lib/phone';

type AdminTab =
  | 'overview'
  | 'earnings'
  | 'tasks'
  | 'add-task'
  | 'categories'
  | 'submissions'
  | 'users'
  | 'wallets'
  | 'adverts'
  | 'banners-social'
  | 'admin-settings';

const ErrorBanner = ({ error, onRetry, onDismiss }: { error: string, onRetry?: () => void, onDismiss: () => void }) => {
  if (!error) return null;
  return (
    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg shadow-rose-900/20">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>{error}</span>
      </div>
      <div className="flex items-center gap-3">
        {onRetry && (
          <button onClick={onRetry} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
        <button onClick={onDismiss} className="text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lists State
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState({ pendingReview: 0, approved: 0, rejected: 0, total: 0 });
  const [advertsList, setAdvertsList] = useState<any[]>([]);
  const [bannersList, setBannersList] = useState<any[]>([]);
  const [socialLinksList, setSocialLinksList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Earnings & Financial Ledger States (Requirements 4, 5, 6, 21, 23)
  const [earningsData, setEarningsData] = useState<any>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [ledgerFilterType, setLedgerFilterType] = useState<string>('ALL');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [feeSettingsInput, setFeeSettingsInput] = useState({
    activationFeeKES: '200',
    adminActivationEarningKES: '100',
    referralRewardKES: '100',
    platformRetainedAmountKES: '100',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Submissions sub-filter
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'>('UNDER_REVIEW');
  const [rejectModalSub, setRejectModalSub] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin Auth Gate States
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // In-Page Admin Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Task Creation Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    reward: '75',
    instructions: '',
    rules: '',
    proofRequired: 'Submit text response, completion link, or screenshot proof',
    durationSeconds: '120',
    totalSlots: '100',
    externalUrl: '',
    status: 'PUBLISHED',
  });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Category Creation State
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', icon: 'CheckCircle' });
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Advert Creation State
  const [advertForm, setAdvertForm] = useState({
    title: '',
    advertiser: '',
    mediaUrl: '',
    targetUrl: '',
    durationSeconds: '30',
    reward: '5.0',
    dailyLimit: '10',
    description: '',
    status: 'ACTIVE',
  });
  const [advertSubmitting, setAdvertSubmitting] = useState(false);

  // Password Form State
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [adminPassSubmitting, setAdminPassSubmitting] = useState(false);

  // Filter & Search States
  const [userSearch, setUserSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'COMPLETED' | 'REJECTED' | 'PENDING'>('ALL');
  const [taskSearch, setTaskSearch] = useState('');

  // API Error States
  const [statsError, setStatsError] = useState('');
  const [tasksError, setTasksError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');
  const [submissionsError, setSubmissionsError] = useState('');
  const [withdrawalsError, setWithdrawalsError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [advertsError, setAdvertsError] = useState('');
  const [bannersSocialError, setBannersSocialError] = useState('');
  const [earningsError, setEarningsError] = useState('');

  const sessionExpiredHandled = useRef(false);

  const handle401Expired = async () => {
    if (sessionExpiredHandled.current) return;
    sessionExpiredHandled.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        window.location.replace('/admin/login');
        return;
      }
      throw new Error('Logout failed');
    } catch (e) {
      clearTimeout(timeoutId);
      sessionExpiredHandled.current = false;
      setIsAdminAuthed(false);
      setAdminUser(null);
      setError("Session problem. Couldn't sign you out. Try again.");
    }
  };

  const handleApiError = (res: Response, setErrorState: (msg: string) => void, fallbackMsg: string) => {
    if (res.status === 401) {
      handle401Expired();
    } else if (res.status === 403) {
      setErrorState('Access denied.');
    } else {
      setErrorState(fallbackMsg);
    }
  };

  // API Fetchers
  const fetchStats = async () => {
    setStatsError('');
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        setStats(await res.json());
      } else {
        handleApiError(res, setStatsError, "Couldn't load stats. Retry");
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
      setStatsError("Couldn't load stats. Retry");
    }
  };

  const fetchTasks = async () => {
    setTasksError('');
    try {
      const res = await fetch('/api/admin/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasksList(data.tasks || []);
        if (data.categories) setCategoriesList(data.categories);
      } else {
        handleApiError(res, setTasksError, "Couldn't load tasks. Retry");
      }
    } catch (e) {
      console.error("Failed to load tasks:", e);
      setTasksError("Couldn't load tasks. Retry");
    }
  };

  const fetchCategories = async () => {
    setCategoriesError('');
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data.categories || []);
      } else {
        handleApiError(res, setCategoriesError, "Couldn't load categories. Retry");
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
      setCategoriesError("Couldn't load categories. Retry");
    }
  };

  const fetchSubmissions = async () => {
    setSubmissionsError('');
    try {
      const res = await fetch(`/api/admin/submissions?status=${submissionFilter}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissionsList(data.taskSubmissions || []);
        if (data.counts) setSubmissionCounts(data.counts);
      } else {
        handleApiError(res, setSubmissionsError, "Couldn't load submissions. Retry");
      }
    } catch (e) {
      console.error("Failed to load submissions:", e);
      setSubmissionsError("Couldn't load submissions. Retry");
    }
  };

  const fetchWithdrawals = async () => {
    setWithdrawalsError('');
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawalsList(data.withdrawals || []);
      } else {
        handleApiError(res, setWithdrawalsError, "Couldn't load withdrawals. Retry");
      }
    } catch (e) {
      console.error("Failed to load withdrawals:", e);
      setWithdrawalsError("Couldn't load withdrawals. Retry");
    }
  };

  const fetchUsers = async () => {
    setUsersError('');
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      } else {
        handleApiError(res, setUsersError, "Couldn't load users. Retry");
      }
    } catch (e) {
      console.error("Failed to load users:", e);
      setUsersError("Couldn't load users. Retry");
    }
  };

  const fetchAdverts = async () => {
    setAdvertsError('');
    try {
      const res = await fetch('/api/admin/adverts');
      if (res.ok) {
        const data = await res.json();
        setAdvertsList(data.adverts || []);
      } else {
        handleApiError(res, setAdvertsError, "Couldn't load adverts. Retry");
      }
    } catch (e) {
      console.error("Failed to load adverts:", e);
      setAdvertsError("Couldn't load adverts. Retry");
    }
  };

  const fetchBannersAndSocial = async () => {
    setBannersSocialError('');
    try {
      const [bRes, sRes] = await Promise.all([
        fetch('/api/admin/banners'),
        fetch('/api/admin/social-links'),
      ]);
      if (bRes.ok) {
        setBannersList((await bRes.json()).banners || []);
      } else {
        handleApiError(bRes, setBannersSocialError, "Couldn't load banners. Retry");
      }
      
      if (sRes.ok) {
        setSocialLinksList((await sRes.json()).links || []);
      } else {
        handleApiError(sRes, setBannersSocialError, "Couldn't load social links. Retry");
      }
    } catch (e) {
      console.error("Failed to load banners and social links:", e);
      setBannersSocialError("Couldn't load banners/socials. Retry");
    }
  };

  const fetchEarnings = async () => {
    setEarningsError('');
    try {
      setEarningsLoading(true);
      const url = new URL('/api/admin/earnings', window.location.origin);
      if (ledgerFilterType && ledgerFilterType !== 'ALL') {
        url.searchParams.set('type', ledgerFilterType);
      }
      if (ledgerSearch.trim()) {
        url.searchParams.set('search', ledgerSearch.trim());
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setEarningsData(data);
        if (data.config) {
          setFeeSettingsInput({
            activationFeeKES: data.config.activationFeeKES?.toString() || '200',
            adminActivationEarningKES: data.config.adminActivationEarningKES?.toString() || '100',
            referralRewardKES: data.config.referralRewardKES?.toString() || '100',
            platformRetainedAmountKES: data.config.platformRetainedAmountKES?.toString() || '100',
          });
        }
      } else {
        handleApiError(res, setEarningsError, "Couldn't load earnings. Retry");
      }
    } catch (e) {
      console.error("Failed to load earnings:", e);
      setEarningsError("Couldn't load earnings. Retry");
    } finally {
      setEarningsLoading(false);
    }
  };

  const handleSaveFinancialConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/earnings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activationFeeKES: parseFloat(feeSettingsInput.activationFeeKES),
          adminActivationEarningKES: parseFloat(feeSettingsInput.adminActivationEarningKES),
          referralRewardKES: parseFloat(feeSettingsInput.referralRewardKES),
          platformRetainedAmountKES: parseFloat(feeSettingsInput.platformRetainedAmountKES),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update financial settings');
      setSuccessMsg('Financial configuration updated successfully.');
      fetchEarnings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchTasks(),
      fetchCategories(),
      fetchSubmissions(),
      fetchWithdrawals(),
      fetchUsers(),
      fetchAdverts(),
      fetchBannersAndSocial(),
      fetchEarnings(),
    ]);
    setLoading(false);
  };

  const checkAdminAuth = async () => {
    setCheckingAuth(true);
    setError('');
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data?.user?.role === 'ADMIN') {
          sessionExpiredHandled.current = false;
          setIsAdminAuthed(true);
          setAdminUser(data.user);
          
          try {
            await loadAll();
          } catch (e) {
            console.error("Data load failed:", e);
          }
          
          setCheckingAuth(false);
          return;
        } else {
          // Logged in user is not an admin
          await handle401Expired();
          setCheckingAuth(false);
          return;
        }
      } else if (res.status === 401) {
        // Explicit 401 from /api/auth/me -> trigger 401 logout-and-redirect
        await handle401Expired();
        setCheckingAuth(false);
        return;
      } else {
        // Network error / 500 status -> show retry banner, DO NOT log admin out
        setError("Couldn't verify admin session. Check your connection.");
        setIsAdminAuthed(true);
        setCheckingAuth(false);
        return;
      }
    } catch (e) {
      console.error("Auth check failed:", e);
      setError("Network error verifying session. Check your connection.");
      setIsAdminAuthed(true);
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAdminAuthed) {
      fetchSubmissions();
    }
  }, [submissionFilter, isAdminAuthed]);

  useEffect(() => {
    if (isAdminAuthed && activeTab === 'earnings') {
      fetchEarnings();
    }
  }, [ledgerFilterType, activeTab, isAdminAuthed]);

  const handleLogout = async () => {
    setError('');
    setLogoutLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error('Server error during logout');
      }
      // Cookie cleared — use replace() so Back button cannot restore this page
      window.location.replace('/admin/login');
    } catch (e: any) {
      clearTimeout(timeoutId);
      setLogoutLoading(false);
      setError('Couldn\'t log out. Check your connection and try again.');
    }
  };

  // Task Actions (Create, Pause/Resume, Delete)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setTaskSubmitting(true);

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      setSuccessMsg(data.message || 'Task published successfully!');
      setTaskForm({
        title: '',
        description: '',
        categoryId: categoriesList[0]?.id || '',
        reward: '75',
        instructions: '',
        rules: '',
        proofRequired: 'Submit text response, completion link, or screenshot proof',
        durationSeconds: '120',
        totalSlots: '100',
        externalUrl: '',
        status: 'PUBLISHED',
      });
      fetchTasks();
      setActiveTab('tasks');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (res.ok) {
        setSuccessMsg(`Task status updated to ${nextStatus}`);
        fetchTasks();
      }
    } catch (e) {}
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to remove or close this task?')) return;
    try {
      const res = await fetch(`/api/admin/tasks?id=${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Task updated.');
        fetchTasks();
      }
    } catch (e) {}
  };

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setCategorySubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');

      setSuccessMsg(`Category "${data.category?.name}" created!`);
      setCategoryForm({ name: '', slug: '', description: '', icon: 'CheckCircle' });
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleToggleCategory = async (cat: any) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
      });
      if (res.ok) {
        setSuccessMsg(`Category ${cat.name} ${cat.isActive ? 'deactivated' : 'activated'}.`);
        fetchCategories();
      }
    } catch (e) {}
  };

  // Submission Review Actions (Approve & Reject)
  const handleApproveSubmission = async (sub: any) => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionType: 'TASK',
          submissionId: sub.id,
          action: 'APPROVE',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      setSuccessMsg(data.message || 'Submission approved and reward credited!');
      fetchSubmissions();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmission = async () => {
    if (!rejectModalSub) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionType: 'TASK',
          submissionId: rejectModalSub.id,
          action: 'REJECT',
          rejectionReason: rejectionReasonInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');

      setSuccessMsg('Submission rejected. User notified with feedback.');
      setRejectModalSub(null);
      setRejectionReasonInput('');
      fetchSubmissions();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Advert Actions
  const handleCreateAdvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setAdvertSubmitting(true);

    try {
      const res = await fetch('/api/admin/adverts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advertForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create advert');

      setSuccessMsg(data.message || 'Advert campaign created successfully!');
      setAdvertForm({
        title: '',
        advertiser: '',
        mediaUrl: '',
        targetUrl: '',
        durationSeconds: '30',
        reward: '5.0',
        dailyLimit: '10',
        description: '',
        status: 'ACTIVE',
      });
      fetchAdverts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdvertSubmitting(false);
    }
  };

  const handleToggleAdvertStatus = async (ad: any) => {
    const nextStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/adverts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, status: nextStatus }),
      });
      if (res.ok) {
        setSuccessMsg(`Advert status updated to ${nextStatus}.`);
        fetchAdverts();
      }
    } catch (e) {}
  };

  const handleDeleteAdvert = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this advert?')) return;
    try {
      const res = await fetch(`/api/admin/adverts?id=${adId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Advert deleted.');
        fetchAdverts();
      }
    } catch (e) {}
  };

  // Withdrawal Approval Action
  const handleUpdateWithdrawalStatus = async (withdrawalId: string, status: 'PAID' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          status,
          mpesaReceipt: status === 'PAID' ? `MINT${Math.floor(100000 + Math.random() * 900000)}` : undefined,
          adminNotes: status === 'PAID' ? 'Approved & paid out via M-Pesa' : 'Withdrawal rejected by administrator',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update withdrawal');

      setSuccessMsg(`Withdrawal ${status === 'PAID' ? 'approved and marked PAID' : 'marked REJECTED'}.`);
      fetchWithdrawals();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Admin Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (adminNewPassword !== adminConfirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (adminNewPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setAdminPassSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: adminCurrentPassword, newPassword: adminNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setSuccessMsg('Admin security password updated successfully!');
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdminPassSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold tracking-wider uppercase text-slate-300">Verifying Admin Privileges...</p>
        </div>
      </div>
    );
  }

  // IF NOT AUTHENTICATED AS ADMIN
  if (!isAdminAuthed) {
    return (
      <div className="min-h-screen bg-dark-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-brand-500 to-emerald-400 p-0.5 shadow-xl shadow-amber-500/10 mx-auto">
            <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">TaskMint Admin Portal</h1>
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => checkAdminAuth()}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition-colors shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}
          <button
            onClick={() => handle401Expired()}
            className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-all"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // SIDEBAR NAVIGATION ITEMS (Requirement 11)
  const navItems: { id: AdminTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings & Ledger', icon: TrendingUp },
    { id: 'tasks', label: 'Tasks Management', icon: CheckSquare, count: tasksList.length },
    { id: 'add-task', label: 'Add New Task', icon: PlusCircle },
    { id: 'categories', label: 'Task Categories', icon: Tag, count: categoriesList.length },
    { id: 'submissions', label: 'Submissions Review', icon: FileText, count: submissionCounts.pendingReview },
    { id: 'wallets', label: 'Wallets & Withdrawals', icon: Wallet, count: stats?.wallets?.pendingWithdrawalsCount },
    { id: 'users', label: 'User Directory', icon: Users, count: stats?.users?.total },
    { id: 'adverts', label: 'Advert Campaigns', icon: PlaySquare, count: advertsList.length },
    { id: 'banners-social', label: 'Banners & Social', icon: Sparkles },
    { id: 'admin-settings', label: 'Security & Password', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      {/* MOBILE TOP BAR WITH ☰ MENU BUTTON */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-dark-900 border-b border-dark-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-dark-950 text-sm">
            TM
          </div>
          <span className="font-extrabold text-white text-base">
            TaskMint <span className="text-brand-400 text-xs uppercase px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">Admin</span>
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-dark-800 text-slate-300 hover:text-white border border-dark-700 flex items-center gap-1.5 text-xs font-bold"
        >
          <Menu className="w-5 h-5" />
          <span>ADMIN MENU</span>
        </button>
      </div>

      {/* MOBILE SLIDE-OVER DRAWER (Requirement 20) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-dark-950 border-r border-dark-800 flex flex-col justify-between p-5 z-10 h-full overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-dark-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-black text-dark-950 text-sm">
                    TM
                  </div>
                  <span className="font-bold text-white text-sm">TaskMint Admin</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-brand-500 text-dark-950 font-black shadow-md shadow-brand-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-dark-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                            isActive ? 'bg-dark-950 text-brand-300' : 'bg-dark-900 text-slate-300'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-dark-800">
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{logoutLoading ? 'Logging out...' : 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP FIXED LEFT SIDEBAR (Requirement 11) */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-dark-950 border-r border-dark-800/90 z-30 p-5 justify-between">
        <div className="space-y-6 overflow-y-auto pr-1">
          {/* Admin Header Branding */}
          <div className="flex items-center gap-2.5 pb-5 border-b border-dark-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-black text-dark-950 text-base shadow-md shadow-brand-500/20">
              TM
            </div>
            <div>
              <span className="font-extrabold text-white text-sm block">TaskMint</span>
              <span className="text-[10px] text-brand-400 font-bold tracking-wider uppercase flex items-center gap-1">
                <Shield className="w-3 h-3" /> Control Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-dark-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                        isActive ? 'bg-dark-950 text-brand-300' : 'bg-dark-900 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin User & Logout */}
        <div className="pt-4 border-t border-dark-800 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">{adminUser?.fullName || 'Administrator'}</span>
              <span className="text-[10px] text-slate-400 font-mono block">@{adminUser?.username || 'admin'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>{logoutLoading ? 'Logging out...' : 'Terminate Admin Session'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg shadow-rose-900/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => checkAdminAuth()}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
              <button onClick={() => setError('')} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={statsError} onRetry={fetchStats} onDismiss={() => setStatsError('')} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Administrative Overview</h1>
                <p className="text-xs text-slate-400 mt-0.5">Real-time platform metrics and activity summary.</p>
              </div>

              <button
                onClick={loadAll}
                className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 self-start cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Pending Submissions
                  <FileText className="w-4 h-4 text-amber-400" />
                </span>
                <p className="text-2xl font-black text-white">{stats?.submissions?.pendingReview || 0}</p>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-xs text-brand-400 font-bold hover:underline flex items-center gap-1 cursor-pointer pt-1"
                >
                  Review Submissions <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Pending Withdrawals
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-2xl font-black text-white">
                  KES {stats?.wallets?.pendingWithdrawalsKES?.toLocaleString() || 0}
                </p>
                <span className="text-xs text-slate-400 block">
                  {stats?.wallets?.pendingWithdrawalsCount || 0} requests awaiting review
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Total Registered Users
                  <Users className="w-4 h-4 text-blue-400" />
                </span>
                <p className="text-2xl font-black text-white">{stats?.users?.total || 0}</p>
                <span className="text-xs text-slate-400 block">
                  {stats?.users?.verified || 0} Safaricom phone verified
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Published Tasks
                  <CheckSquare className="w-4 h-4 text-brand-400" />
                </span>
                <p className="text-2xl font-black text-white">{stats?.tasks?.published || 0}</p>
                <span className="text-xs text-slate-400 block">
                  across {stats?.tasks?.categoriesCount || 0} active categories
                </span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-6 rounded-3xl bg-dark-900/80 border border-dark-800 space-y-4">
              <h2 className="text-base font-bold text-white">Administrative Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('add-task')}
                  className="p-4 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-left transition-all cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5 text-brand-400 mb-2" />
                  <span className="text-xs font-bold text-white block">Create & Publish Task</span>
                  <span className="text-[11px] text-slate-400">Add tasks for users to complete</span>
                </button>

                <button
                  onClick={() => setActiveTab('submissions')}
                  className="p-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-white block">Review Worker Submissions</span>
                  <span className="text-[11px] text-slate-400">Approve or reject submitted proof</span>
                </button>

                <button
                  onClick={() => setActiveTab('wallets')}
                  className="p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition-all cursor-pointer"
                >
                  <Wallet className="w-5 h-5 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-white block">Review M-Pesa Payouts</span>
                  <span className="text-[11px] text-slate-400">Process pending withdrawals</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EARNINGS & FINANCIAL LEDGER (Requirements 4, 5, 6, 21, 23, 24) */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={earningsError} onRetry={fetchEarnings} onDismiss={() => setEarningsError('')} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
              <div>
                <h1 className="text-2xl font-black text-white">Platform Revenue & Financial Ledger</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time ledger accounting for activation fees, admin revenue, referral payouts, and platform reserves.
                </p>
              </div>

              <button
                onClick={fetchEarnings}
                disabled={earningsLoading}
                className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 self-start cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${earningsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Ledger</span>
              </button>
            </div>

            {/* Financial Overview Metrics (Requirements 5 & 24) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Total Activation Revenue */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Activation Revenue
                  <Coins className="w-4 h-4 text-brand-400" />
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  KES {(earningsData?.stats?.totalActivationRevenue || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-dark-800/80">
                  <span>{earningsData?.stats?.totalActivationPayments || 0} Paid Activations</span>
                  <span className="text-amber-400 font-bold">{earningsData?.stats?.pendingDepositsCount || 0} Pending</span>
                </div>
              </div>

              {/* 2. Admin Activation Earnings (KES 100/activation) */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-emerald-500/20 glow-emerald space-y-2">
                <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Admin Activation Earnings
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  KES {(earningsData?.stats?.totalAdminEarnings || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </p>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-dark-800/80 flex items-center justify-between">
                  <span>Today: KES {(earningsData?.stats?.todayAdminEarnings || 0).toLocaleString()}</span>
                  <span>Month: KES {(earningsData?.stats?.thisMonthAdminEarnings || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* 3. Referral Rewards Disbursed (KES 100/referral) */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-cyan-500/20 space-y-2">
                <span className="text-[11px] text-cyan-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Referral Rewards Paid
                  <Users className="w-4 h-4 text-cyan-400" />
                </span>
                <p className="text-2xl font-black text-cyan-300 font-mono">
                  KES {(earningsData?.stats?.totalReferralRewardsPaid || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-dark-800/80">
                  KES 100 credited to referring user wallets
                </p>
              </div>

              {/* 4. Platform Retained Reserve */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-purple-500/20 space-y-2">
                <span className="text-[11px] text-purple-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Platform Retained Reserve
                  <Shield className="w-4 h-4 text-purple-400" />
                </span>
                <p className="text-2xl font-black text-purple-300 font-mono">
                  KES {(earningsData?.stats?.totalPlatformRetained || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-dark-800/80">
                  Unreferred activations (100% balanced ledger)
                </p>
              </div>
            </div>

            {/* Financial Parameters Settings Card (Requirement 23) */}
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-brand-400" />
                    Configurable Financial Rules
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authoritative backend parameters controlling activation fees, admin earnings, and referral rewards.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveFinancialConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Activation Fee (KES)</label>
                  <input
                    type="number"
                    value={feeSettingsInput.activationFeeKES}
                    onChange={(e) => setFeeSettingsInput({ ...feeSettingsInput, activationFeeKES: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">Paid by new workers upon registration</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Admin Earning (KES)</label>
                  <input
                    type="number"
                    value={feeSettingsInput.adminActivationEarningKES}
                    onChange={(e) => setFeeSettingsInput({ ...feeSettingsInput, adminActivationEarningKES: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-emerald-400 text-xs font-mono focus:outline-none focus:border-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">Platform admin revenue per activation</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Referral Reward (KES)</label>
                  <input
                    type="number"
                    value={feeSettingsInput.referralRewardKES}
                    onChange={(e) => setFeeSettingsInput({ ...feeSettingsInput, referralRewardKES: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-cyan-400 text-xs font-mono focus:outline-none focus:border-brand-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">Credited to referrer upon activation</p>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Save Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Central Financial Ledger Table (Requirements 17 & 21) */}
            <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    Central Transaction Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Immutable financial audit log of every confirmed payment, earning, and reward.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ALL', label: 'All Transactions' },
                    { id: 'ACTIVATION_ADMIN_EARNING', label: 'Admin Earnings' },
                    { id: 'ACTIVATION_PAYMENT', label: 'Activation Fees' },
                    { id: 'REFERRAL_REWARD', label: 'Referral Rewards' },
                    { id: 'PLATFORM_RETAINED_AMOUNT', label: 'Retained Reserve' },
                    { id: 'TASK_REWARD', label: 'Task Rewards' },
                    { id: 'WITHDRAWAL', label: 'Withdrawals' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setLedgerFilterType(filter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        ledgerFilterType === filter.id
                          ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                          : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ledger by receipt reference, source, username, or phone..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Ledger Entries Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-dark-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Transaction Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">User / Participant</th>
                      <th className="pb-3">Source Channel</th>
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60">
                    {!earningsData?.ledgerEntries || earningsData.ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500">
                          No ledger records found for this filter.
                        </td>
                      </tr>
                    ) : (
                      earningsData.ledgerEntries.map((entry: any) => {
                        const isCredit = ['ACTIVATION_ADMIN_EARNING', 'REFERRAL_REWARD', 'TASK_REWARD', 'ACTIVATION_PAYMENT', 'PLATFORM_RETAINED_AMOUNT'].includes(entry.type);
                        return (
                          <tr key={entry.id} className="hover:bg-dark-800/30 transition-colors">
                            <td className="py-3 font-mono font-bold text-white">
                              {entry.reference}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  entry.type === 'ACTIVATION_ADMIN_EARNING'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : entry.type === 'ACTIVATION_PAYMENT'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                    : entry.type === 'REFERRAL_REWARD'
                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                    : entry.type === 'PLATFORM_RETAINED_AMOUNT'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                    : entry.type === 'TASK_REWARD'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {entry.type}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-bold text-sm">
                              <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                                {isCredit ? '+' : '-'}KES {entry.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 text-slate-300">
                              {entry.user ? (
                                <div>
                                  <span className="font-semibold block">{entry.user.fullName || entry.user.username}</span>
                                  <span className="text-[10px] text-slate-500">@{entry.user.username} · {entry.user.phone}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Platform System Account</span>
                              )}
                            </td>
                            <td className="py-3 font-mono text-[11px] text-slate-400">
                              {entry.source}
                            </td>
                            <td className="py-3 text-slate-400 text-[11px] font-mono">
                              {new Date(entry.createdAt).toLocaleString('en-KE')}
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS MANAGEMENT (Requirement 13) */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={tasksError} onRetry={fetchTasks} onDismiss={() => setTasksError('')} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
              <div>
                <h1 className="text-2xl font-black text-white">Task Management</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Administrative overview of slots, workers, and completion progress.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('add-task')}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Add New Task
              </button>
            </div>

            {/* Task Management Table / Cards */}
            <div className="space-y-4">
              {tasksList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-dark-900 rounded-3xl border border-dark-800">
                  No tasks created yet. Click "Add New Task" to create one.
                </div>
              ) : (
                tasksList.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-dark-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/20">
                            {task.category?.name || 'Task'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              task.status === 'PUBLISHED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : task.status === 'PAUSED'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{task.title}</h3>
                      </div>

                      {/* Management Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            task.status === 'PUBLISHED'
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          }`}
                        >
                          {task.status === 'PUBLISHED' ? 'Pause Task' : 'Publish Task'}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Delete / Close Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Management Stats Metrics (Requirement 13) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Reward</span>
                        <span className="font-mono font-bold text-brand-400">KES {task.reward?.toFixed(2)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Slots</span>
                        <span className="font-mono font-bold text-white">{task.remainingSlots} / {task.totalSlots}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Started</span>
                        <span className="font-mono font-bold text-white">{task.stats?.started || 0}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Submitted</span>
                        <span className="font-mono font-bold text-white">{task.stats?.submitted || 0}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block text-amber-400">Pending</span>
                        <span className="font-mono font-bold text-amber-400">{task.stats?.pendingReview || 0}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block text-emerald-400">Approved</span>
                        <span className="font-mono font-bold text-emerald-400">{task.stats?.approved || 0}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-dark-950 border border-dark-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block text-rose-400">Rejected</span>
                        <span className="font-mono font-bold text-rose-400">{task.stats?.rejected || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ADD TASK FORM (Requirement 2) */}
        {activeTab === 'add-task' && (
          <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">Create & Publish Task</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Add a new task with complete requirements for users to complete.
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-5 bg-dark-900/80 border border-dark-800 rounded-3xl p-6 sm:p-8">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Wildlife Image Classification"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Category</label>
                  <select
                    value={taskForm.categoryId}
                    onChange={(e) => setTaskForm({ ...taskForm, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select a Category</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Reward (KES)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="75"
                    value={taskForm.reward}
                    onChange={(e) => setTaskForm({ ...taskForm, reward: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Available Slots</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={taskForm.totalSlots}
                    onChange={(e) => setTaskForm({ ...taskForm, totalSlots: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Duration (Seconds)</label>
                  <input
                    type="number"
                    min="10"
                    value={taskForm.durationSeconds}
                    onChange={(e) => setTaskForm({ ...taskForm, durationSeconds: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Initial Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="PUBLISHED">Published (Visible immediately)</option>
                    <option value="DRAFT">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Detailed Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain exactly what the user must do step-by-step..."
                  value={taskForm.instructions}
                  onChange={(e) => setTaskForm({ ...taskForm, instructions: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Proof Required Description</label>
                <input
                  type="text"
                  placeholder="e.g. Submit screenshot showing completed feedback screen"
                  value={taskForm.proofRequired}
                  onChange={(e) => setTaskForm({ ...taskForm, proofRequired: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">External Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={taskForm.externalUrl}
                    onChange={(e) => setTaskForm({ ...taskForm, externalUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Task Rules (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. One attempt per user. Fake screenshots will result in account ban."
                    value={taskForm.rules}
                    onChange={(e) => setTaskForm({ ...taskForm, rules: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={taskSubmitting}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {taskSubmitting ? 'Creating Task...' : 'Publish Task to Marketplace'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: CATEGORIES MANAGER (Requirement 17) */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={categoriesError} onRetry={fetchCategories} onDismiss={() => setCategoriesError('')} />
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">Task Categories</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized category configuration. Deactivated categories preserve existing tasks.
              </p>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Add New Category</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Category Name (e.g. Survey)"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Short Description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="px-4 py-2.5 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500 sm:col-span-2"
                />
              </div>
              <button
                type="submit"
                disabled={categorySubmitting}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs cursor-pointer"
              >
                {categorySubmitting ? 'Saving...' : 'Add Category'}
              </button>
            </form>

            {/* Categories List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriesList.map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{cat.name}</span>
                    <span className="text-[11px] text-slate-400 block">{cat.description}</span>
                    <span className="text-[10px] text-brand-400 font-mono mt-1 block">
                      {cat._count?.tasks || 0} associated tasks
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${
                      cat.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SUBMISSIONS REVIEW (Requirements 7, 8, 9, 10) */}
        {activeTab === 'submissions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={submissionsError} onRetry={fetchSubmissions} onDismiss={() => setSubmissionsError('')} />
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">Submissions Review Queue</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Review submitted proof and approve or reject. Rewards are credited ONLY upon admin approval.
              </p>
            </div>

            {/* Sub-Tabs: Pending Review, Approved, Rejected */}
            <div className="flex items-center gap-2 border-b border-dark-800 pb-2">
              <button
                onClick={() => setSubmissionFilter('UNDER_REVIEW')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  submissionFilter === 'UNDER_REVIEW'
                    ? 'bg-amber-500 text-dark-950 font-black'
                    : 'bg-dark-900 text-slate-400 hover:text-white'
                }`}
              >
                Pending Review ({submissionCounts.pendingReview})
              </button>
              <button
                onClick={() => setSubmissionFilter('APPROVED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  submissionFilter === 'APPROVED'
                    ? 'bg-emerald-500 text-dark-950 font-black'
                    : 'bg-dark-900 text-slate-400 hover:text-white'
                }`}
              >
                Approved ({submissionCounts.approved})
              </button>
              <button
                onClick={() => setSubmissionFilter('REJECTED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  submissionFilter === 'REJECTED'
                    ? 'bg-rose-500 text-white font-black'
                    : 'bg-dark-900 text-slate-400 hover:text-white'
                }`}
              >
                Rejected ({submissionCounts.rejected})
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {submissionsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-dark-900 rounded-3xl border border-dark-800">
                  No submissions in this queue.
                </div>
              ) : (
                submissionsList.map((sub) => (
                  <div key={sub.id} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-dark-800 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">
                          Submission ID: {sub.id.slice(0, 8)}...
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">{sub.task?.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>Worker: <strong className="text-white">@{sub.user?.username}</strong></span>
                          <span>•</span>
                          <span>Phone: <strong className="text-white font-mono">{formatKenyanPhoneDisplay(sub.user?.phone)}</strong></span>
                          <span>•</span>
                          <span>Reward: <strong className="text-brand-400 font-mono">KES {sub.task?.reward?.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold self-start ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : sub.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    {/* Submitted Proof Inspection */}
                    <div className="p-4 rounded-xl bg-dark-950 border border-dark-800/80 space-y-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Submitted Proof of Work:
                      </span>
                      {sub.proofText && (
                        <p className="text-slate-200 whitespace-pre-wrap">{sub.proofText}</p>
                      )}
                      {sub.proofUrl && (
                        <div className="pt-2 flex items-center gap-3">
                          <a
                            href={sub.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-brand-400 hover:underline font-mono"
                          >
                            <span>Open Proof Attachment</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                      {sub.rejectionReason && (
                        <div className="pt-2 text-rose-400 font-medium">
                          <strong>Rejection Reason:</strong> {sub.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Actions: Approve / Reject (Only for UNDER_REVIEW) */}
                    {sub.status === 'UNDER_REVIEW' && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleApproveSubmission(sub)}
                          disabled={actionLoading}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          <Check className="w-4 h-4" /> Approve & Credit KES {sub.task?.reward}
                        </button>

                        <button
                          onClick={() => {
                            setRejectModalSub(sub);
                            setRejectionReasonInput('');
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Reject Submission
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* REJECTION REASON MODAL (Requirement 10) */}
            {rejectModalSub && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold text-white">Provide Rejection Reason</h3>
                  <p className="text-xs text-slate-400">
                    The user will see this feedback in their Tasks dashboard.
                  </p>

                  <textarea
                    rows={3}
                    placeholder="e.g. Screenshot did not match instructions, or incomplete work..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setRejectModalSub(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectSubmission}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: WALLETS & WITHDRAWALS (Requirements 14 & 15) */}
        {activeTab === 'wallets' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={withdrawalsError} onRetry={fetchWithdrawals} onDismiss={() => setWithdrawalsError('')} />
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">User Wallets & Withdrawals</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated from actual database user wallet records. No hardcoded metrics.
              </p>
            </div>

            {/* Real Wallet Database Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total User Wallets</span>
                <p className="text-2xl font-black text-white font-mono">{stats?.wallets?.totalWallets || 0}</p>
                <span className="text-xs text-slate-400">1:1 User-to-Wallet mapping</span>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Wallets With Balance</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">{stats?.wallets?.walletsWithBalance || 0}</p>
                <span className="text-xs text-slate-400">Users with funds &gt; KES 0</span>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total User Balance</span>
                <p className="text-2xl font-black text-brand-400 font-mono">
                  KES {stats?.wallets?.totalUserBalanceKES?.toLocaleString() || '0.00'}
                </p>
                <span className="text-xs text-slate-400">Total available worker funds</span>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Completed Payouts</span>
                <p className="text-2xl font-black text-white font-mono">
                  KES {stats?.wallets?.completedWithdrawalsKES?.toLocaleString() || '0.00'}
                </p>
                <span className="text-xs text-slate-400">{stats?.wallets?.completedWithdrawalsCount || 0} processed</span>
              </div>
            </div>

            {/* Withdrawals Management Queue */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">Withdrawal Requests Queue</h2>
              {withdrawalsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-dark-900 rounded-3xl border border-dark-800">
                  No withdrawal requests in database.
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawalsList.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">@{w.user?.username || 'User'}</span>
                          <span className="text-xs text-slate-400 font-mono">({w.mpesaNumber})</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              w.status === 'PAID' || w.status === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : w.status === 'REJECTED'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono mt-1 block">
                          KES {w.amount?.toFixed(2)} requested on {new Date(w.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {w.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateWithdrawalStatus(w.id, 'PAID')}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs cursor-pointer"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleUpdateWithdrawalStatus(w.id, 'REJECTED')}
                            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: ADVERTS (Requirement 16) */}
        {activeTab === 'adverts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={advertsError} onRetry={fetchAdverts} onDismiss={() => setAdvertsError('')} />
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">Sponsored Advert Campaigns</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage video advertisements and brand partner campaigns.
              </p>
            </div>

            {/* Add Advert Form */}
            <form onSubmit={handleCreateAdvert} className="p-6 rounded-3xl bg-dark-900/80 border border-dark-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Create New Advert</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Advert Title"
                  value={advertForm.title}
                  onChange={(e) => setAdvertForm({ ...advertForm, title: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Brand / Sponsor Name"
                  value={advertForm.advertiser}
                  onChange={(e) => setAdvertForm({ ...advertForm, advertiser: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="url"
                  required
                  placeholder="Media / Image URL"
                  value={advertForm.mediaUrl}
                  onChange={(e) => setAdvertForm({ ...advertForm, mediaUrl: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
                <input
                  type="url"
                  placeholder="Destination Target Link (Optional)"
                  value={advertForm.targetUrl}
                  onChange={(e) => setAdvertForm({ ...advertForm, targetUrl: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Duration (Secs)"
                  value={advertForm.durationSeconds}
                  onChange={(e) => setAdvertForm({ ...advertForm, durationSeconds: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs font-mono"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Reward (KES)"
                  value={advertForm.reward}
                  onChange={(e) => setAdvertForm({ ...advertForm, reward: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs font-mono"
                />
                <select
                  value={advertForm.status}
                  onChange={(e) => setAdvertForm({ ...advertForm, status: e.target.value })}
                  className="px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs"
                >
                  <option value="ACTIVE">Active (Published)</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={advertSubmitting}
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs cursor-pointer"
              >
                {advertSubmitting ? 'Publishing...' : 'Publish Advert'}
              </button>
            </form>

            {/* Adverts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {advertsList.map((ad) => (
                <div key={ad.id} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden bg-dark-950 border border-dark-800">
                    <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-400 font-bold uppercase">{ad.advertiser}</span>
                    <h4 className="text-sm font-bold text-white">{ad.title}</h4>
                    <span className="text-xs text-slate-400 block font-mono">
                      KES {ad.reward?.toFixed(2)} • {ad.durationSeconds}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-dark-800">
                    <button
                      onClick={() => handleToggleAdvertStatus(ad)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        ad.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ad.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDeleteAdvert(ad.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: USERS DIRECTORY (Requirement 24: No Account Tiers) */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={usersError} onRetry={fetchUsers} onDismiss={() => setUsersError('')} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-4">
              <div>
                <h1 className="text-2xl font-black text-white">User Directory</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage accounts and verify Safaricom phone credentials. No account tiers are displayed.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-white text-xs w-full sm:w-64 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-3">
              {usersList
                .filter(
                  (u) =>
                    !userSearch ||
                    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.phone?.includes(userSearch)
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">@{u.username}</span>
                        <span className="text-xs text-slate-400">({u.fullName})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-brand-500/20 text-brand-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>Email: <strong className="text-slate-300">{u.email}</strong></span>
                        <span>•</span>
                        <span>Phone: <strong className="text-slate-300 font-mono">{formatKenyanPhoneDisplay(u.phone)}</strong></span>
                        {u.phoneVerified && (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 9: BANNERS & SOCIAL */}
        {activeTab === 'banners-social' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={bannersSocialError} onRetry={fetchBannersAndSocial} onDismiss={() => setBannersSocialError('')} />
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">Banners &amp; Social Communities</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage homepage banner carousels and official social links.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Banners List */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Active Promotional Banners</h3>
                {bannersList.length === 0 ? (
                  <p className="text-xs text-slate-400">No active banners.</p>
                ) : (
                  bannersList.map((b) => (
                    <div key={b.id} className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{b.title}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                    </div>
                  ))
                )}
              </div>

              {/* Social Links List */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Community Channels</h3>
                {socialLinksList.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.url}</span>
                    </div>
                    <span className="text-[10px] text-brand-400 font-bold uppercase">{s.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: ADMIN SECURITY & PASSWORD */}
        {activeTab === 'admin-settings' && (
          <div className="space-y-6 max-w-xl animate-in fade-in duration-200">
            <div className="border-b border-dark-800 pb-4">
              <h1 className="text-2xl font-black text-white">Admin Security Credentials</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your administrative login password. Password changes require immediate bcrypt re-hashing.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 bg-dark-900/80 border border-dark-800 rounded-3xl p-6 sm:p-8">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={adminCurrentPassword}
                    onChange={(e) => setAdminCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">New Password (min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminPassSubmitting}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {adminPassSubmitting ? 'Updating...' : 'Update Admin Password'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
