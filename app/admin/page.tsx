'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ArrowUp,
  ArrowDown,
  Edit,
  ToggleLeft,
  ToggleRight,
  Plus,
} from 'lucide-react';
import { formatKenyanPhoneDisplay } from '@/lib/phone';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

type AdminTab =
  | 'overview'
  | 'admin-actions'
  | 'earnings'
  | 'tasks'
  | 'add-task'
  | 'categories'
  | 'submissions'
  | 'users'
  | 'packages'
  | 'wallets'
  | 'adverts'
  | 'banners-social'
  | 'admin-settings'
  | 'audit-logs';

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

function AdminDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = ((searchParams.get('tab') as AdminTab) || 'overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  // Banner form state
  const [bannerPlacementFilter, setBannerPlacementFilter] = useState<'landing' | 'home'>('landing');
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    body: '',
    imageUrl: '',
    imageAlt: '',
    ctaLabel: '',
    ctaUrl: '',
    linkUrl: '',
    placement: 'landing',
    sortOrder: 0,
    isActive: true,
    startsAt: '',
    endsAt: '',
  });
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

  // Social link form state
  const [socialForm, setSocialForm] = useState({
    platform: 'whatsapp',
    label: 'WhatsApp Community',
    url: '',
    icon_key: 'whatsapp',
    placement: ['community_row'],
    sort_order: 0,
    isActive: true,
  });
  const [editingSocialLink, setEditingSocialLink] = useState<any | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lists State
  const [tasksList, setTasksList] = useState<any[] | null>(null);
  const [categoriesList, setCategoriesList] = useState<any[] | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState({ pendingReview: 0, approved: 0, rejected: 0, total: 0 });
  const [advertsList, setAdvertsList] = useState<any[] | null>(null);
  const [bannersList, setBannersList] = useState<any[] | null>(null);
  const [socialLinksList, setSocialLinksList] = useState<any[] | null>(null);
  const [withdrawalsList, setWithdrawalsList] = useState<any[] | null>(null);
  const [usersList, setUsersList] = useState<any[] | null>(null);
  const [packagesList, setPackagesList] = useState<any[] | null>(null);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<any[] | null>(null);

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
  const [submissionsFilterLoading, setSubmissionsFilterLoading] = useState(false);
  const [rejectModalSub, setRejectModalSub] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin Auth Gate States
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

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
    status: 'DRAFT',
  });
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

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
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'COMPLETED' | 'REJECTED' | 'PENDING'>('ALL');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [withdrawalStartDate, setWithdrawalStartDate] = useState('');
  const [withdrawalEndDate, setWithdrawalEndDate] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  // Filtered withdrawals memo
  const filteredWithdrawals = useMemo(() => {
    if (!withdrawalsList) return [];
    return withdrawalsList.filter((w) => {
      // Status filter
      if (withdrawalFilter === 'PENDING' && w.status !== 'PENDING') return false;
      if (withdrawalFilter === 'COMPLETED' && w.status !== 'PAID' && w.status !== 'COMPLETED') return false;
      if (withdrawalFilter === 'REJECTED' && w.status !== 'REJECTED') return false;

      // Search filter (username, fullName, email, phone, mpesaNumber, mpesaReceipt)
      if (withdrawalSearch.trim()) {
        const q = withdrawalSearch.toLowerCase().trim();
        const uName = (w.user?.username || '').toLowerCase();
        const fName = (w.user?.fullName || '').toLowerCase();
        const uEmail = (w.user?.email || '').toLowerCase();
        const uPhone = (w.user?.phone || '').toLowerCase();
        const mPhone = (w.mpesaNumber || '').toLowerCase();
        const mReceipt = (w.mpesaReceipt || '').toLowerCase();
        if (!uName.includes(q) && !fName.includes(q) && !uEmail.includes(q) && !uPhone.includes(q) && !mPhone.includes(q) && !mReceipt.includes(q)) {
          return false;
        }
      }

      // Date range filters
      if (withdrawalStartDate) {
        const start = new Date(withdrawalStartDate);
        start.setHours(0, 0, 0, 0);
        const reqDate = new Date(w.requestedAt);
        if (reqDate < start) return false;
      }
      if (withdrawalEndDate) {
        const end = new Date(withdrawalEndDate);
        end.setHours(23, 59, 59, 999);
        const reqDate = new Date(w.requestedAt);
        if (reqDate > end) return false;
      }

      return true;
    });
  }, [withdrawalsList, withdrawalFilter, withdrawalSearch, withdrawalStartDate, withdrawalEndDate]);

  // API Error States
  const [statsError, setStatsError] = useState('');
  const [tasksError, setTasksError] = useState('');
  const [categoriesError, setCategoriesError] = useState('');
  const [submissionsError, setSubmissionsError] = useState('');
  const [withdrawalsError, setWithdrawalsError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [packagesError, setPackagesError] = useState('');
  const [advertsError, setAdvertsError] = useState('');
  const [bannersSocialError, setBannersSocialError] = useState('');
  const [earningsError, setEarningsError] = useState('');
  const [auditLogsError, setAuditLogsError] = useState('');

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
    if (res.status === 401 || res.status === 403) {
      handle401Expired();
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
    setSubmissionsFilterLoading(true);
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
    } finally {
      setSubmissionsFilterLoading(false);
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

  const fetchPackages = async () => {
    setPackagesError('');
    try {
      const res = await fetch('/api/admin/packages');
      if (res.ok) {
        const data = await res.json();
        setPackagesList(data.packages || []);
      } else {
        handleApiError(res, setPackagesError, "Couldn't load packages. Retry");
      }
    } catch (e) {
      console.error("Failed to load packages:", e);
      setPackagesError("Couldn't load packages. Retry");
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

  const fetchAuditLogs = async () => {
    setAuditLogsError('');
    try {
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogsList(data.auditLogs || []);
      } else {
        handleApiError(res, setAuditLogsError, "Couldn't load audit logs. Retry");
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
      setAuditLogsError("Couldn't load audit logs. Retry");
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
      fetchPackages(),
      fetchUsers(),
      fetchAuditLogs(),
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

  // Banners Handlers
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bannerForm,
          sortOrder: parseInt(String(bannerForm.sortOrder)) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save banner');
      setSuccessMsg('Banner created successfully!');
      setBannerForm({
        title: '',
        subtitle: '',
        body: '',
        imageUrl: '',
        imageAlt: '',
        ctaLabel: '',
        ctaUrl: '',
        linkUrl: '',
        placement: bannerPlacementFilter,
        sortOrder: 0,
        isActive: true,
        startsAt: '',
        endsAt: '',
      });
      fetchBannersAndSocial();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    setError('');
    setSuccessMsg('');
    try {
      // 1. Create new entry first to ensure safety
      const { id: oldId, ...payload } = editingBanner;
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sortOrder: parseInt(String(editingBanner.sortOrder)) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update banner');

      // 2. Delete the old entry
      await fetch(`/api/admin/banners?id=${oldId}`, { method: 'DELETE' });

      setSuccessMsg('Banner updated successfully!');
      setEditingBanner(null);
      fetchBannersAndSocial();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleBanner = async (id: string, currentActive: boolean) => {
    setError('');
    try {
      const res = await fetch('/api/admin/banners?action=toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle banner');
      fetchBannersAndSocial();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReorderBanner = async (id: string, direction: 'up' | 'down', currentList: any[]) => {
    const idx = currentList.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const items = [...currentList];
    const temp = items[idx].sortOrder;
    items[idx].sortOrder = items[targetIdx].sortOrder;
    items[targetIdx].sortOrder = temp;

    // If sortOrders are equal, auto assign 0, 1, 2...
    const payloadItems = items.map((item, i) => ({
      id: item.id,
      sortOrder: i,
    }));

    try {
      await fetch('/api/admin/banners?action=reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems }),
      });
      fetchBannersAndSocial();
    } catch (e) {}
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    try {
      await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      fetchBannersAndSocial();
    } catch (e) {}
  };

  // Packages Handlers
  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    setError('');
    setSuccessMsg('');
    if (!confirm(`Update configuration for ${editingPackage.name}? This takes effect immediately.`)) return;
    
    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingPackage,
          price: parseFloat(editingPackage.price) || 0,
          taskLimitDaily: parseInt(editingPackage.taskLimitDaily) || 0,
          watchAdsLimit: parseInt(editingPackage.watchAdsLimit) || 0,
          whatsappTasksLimit: parseInt(editingPackage.whatsappTasksLimit) || 0,
          referralBonus: parseFloat(editingPackage.referralBonus) || 0,
          durationDays: parseInt(editingPackage.durationDays) || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update package');
      setSuccessMsg(`Package ${data.package?.name || editingPackage.name} updated successfully!`);
      setEditingPackage(null);
      fetchPackages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Social Links Handlers
  const handleSaveSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...socialForm,
          sort_order: parseInt(String(socialForm.sort_order)) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save social link');
      setSuccessMsg('Social link saved successfully!');
      setSocialForm({
        platform: 'whatsapp',
        label: 'WhatsApp Community',
        url: '',
        icon_key: 'whatsapp',
        placement: ['community_row'],
        sort_order: 0,
        isActive: true,
      });
      fetchBannersAndSocial();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocialLink) return;
    setError('');
    setSuccessMsg('');
    try {
      // 1. Create new entry first to ensure safety
      const { id: oldId, ...payload } = editingSocialLink;
      const res = await fetch('/api/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sort_order: parseInt(String(editingSocialLink.sort_order)) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update social link');

      // 2. Delete the old entry
      await fetch(`/api/admin/social-links?id=${oldId}`, { method: 'DELETE' });

      setSuccessMsg('Social link updated successfully!');
      setEditingSocialLink(null);
      fetchBannersAndSocial();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleSocialLink = async (id: string, currentActive: boolean) => {
    setError('');
    try {
      const res = await fetch('/api/admin/social-links?action=toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle social link');
      fetchBannersAndSocial();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReorderSocialLink = async (id: string, direction: 'up' | 'down') => {
    if (!socialLinksList) return;
    const idx = socialLinksList.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= socialLinksList.length) return;

    const payloadItems = socialLinksList.map((item, i) => ({
      id: item.id,
      sort_order: i === idx ? targetIdx : i === targetIdx ? idx : i,
    }));

    try {
      await fetch('/api/admin/social-links?action=reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems }),
      });
      fetchBannersAndSocial();
    } catch (e) {}
  };

  const handleDeleteSocialLink = async (id: string) => {
    if (!confirm('Delete social link?')) return;
    try {
      await fetch(`/api/admin/social-links?id=${id}`, { method: 'DELETE' });
      fetchBannersAndSocial();
    } catch (e) {}
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

  // Task Actions (Create, Pause/Resume, Delete)
  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      categoryId: categoriesList?.[0]?.id || '',
      reward: '75',
      instructions: '',
      rules: '',
      proofRequired: 'Submit text response, completion link, or screenshot proof',
      durationSeconds: '120',
      totalSlots: '100',
      externalUrl: '',
      status: 'DRAFT',
    });
    setEditingTask(null);
  };

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

      const isDraft = taskForm.status === 'DRAFT';
      setSuccessMsg(isDraft ? 'Task saved as draft. Publish it from Task Management when ready.' : 'Task published to marketplace!');
      resetTaskForm();
      fetchTasks();
      router.push('/admin?tab=tasks');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      categoryId: task.categoryId || '',
      reward: String(task.reward ?? '75'),
      instructions: task.instructions || '',
      rules: task.rules || '',
      proofRequired: task.proofRequired || 'Submit text response, completion link, or screenshot proof',
      durationSeconds: String(task.durationSeconds ?? '120'),
      totalSlots: String(task.totalSlots ?? '100'),
      externalUrl: task.externalUrl || '',
      status: task.status || 'DRAFT',
    });
    router.push('/admin?tab=add-task');
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setError('');
    setSuccessMsg('');
    setTaskSubmitting(true);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTask.id, ...taskForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');
      setSuccessMsg('Task updated successfully!');
      resetTaskForm();
      fetchTasks();
      router.push('/admin?tab=tasks');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    // DRAFT → PUBLISHED, PUBLISHED → PAUSED, PAUSED → PUBLISHED
    const nextStatus = task.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED';
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (res.ok) {
        setSuccessMsg(
          nextStatus === 'PUBLISHED'
            ? 'Task published to marketplace!'
            : 'Task paused and hidden from users.'
        );
        fetchTasks();
      }
    } catch (e) {}
  };

  const handleRevertToDraft = async (task: any) => {
    const started = task.stats?.started || 0;
    const submitted = task.stats?.submitted || 0;
    const inProgress = started - submitted;
    const pendingReview = task.stats?.pendingReview || 0;
    
    const activeUsers = inProgress + pendingReview;
    
    if (activeUsers > 0) {
      if (!confirm(`Warning: ${activeUsers} users are currently working on or waiting for review on this task. Reverting to draft will hide it from them. Are you sure you want to revert it to Draft?`)) {
        return;
      }
    } else {
      if (!confirm('Are you sure you want to revert this task to Draft?')) {
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'DRAFT' }),
      });
      if (res.ok) {
        setSuccessMsg('Task reverted to Draft.');
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
        setSuccessMsg(data.message || 'Task removed.');
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
      const action = status === 'PAID' ? 'APPROVE' : 'REJECT';
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          action,
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

  // User Ban/Unban Action
  const handleUserBanToggle = async (userId: string, currentStatus: string) => {
    const isBanning = currentStatus !== 'SUSPENDED';
    const action = isBanning ? 'BAN' : 'UNBAN';
    const confirmMessage = isBanning 
      ? "Ban this user? They will be unable to log in."
      : "Unban this user?";
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      setSuccessMsg(`User successfully ${isBanning ? 'banned' : 'unbanned'}.`);
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.message);
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
    // Reusable skeleton primitives — no hooks, pure JSX
    const skMetricCard = (key: number) => (
      <div key={key} className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-4 h-4" />
        </div>
        <Skeleton className="w-32 h-8" />
        <Skeleton className="w-40 h-3" />
      </div>
    );

    const skRowItem = (key: number) => (
      <div key={key} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-16 h-4 rounded-full" />
          </div>
          <Skeleton className="w-64 h-3" />
        </div>
        <Skeleton className="w-16 h-7 rounded-xl" />
      </div>
    );

    const skHeader = (hasButton = true) => (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
        <div className="space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-80 h-4" />
        </div>
        {hasButton && <Skeleton className="w-32 h-9 rounded-xl" />}
      </div>
    );

    let body: React.ReactNode;

    if (activeTab === 'overview') {
      body = (<>
        {skHeader(true)}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => skMetricCard(i))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="w-full h-[300px] rounded-3xl" />
          <Skeleton className="w-full h-[300px] rounded-3xl" />
        </div>
      </>);

    } else if (activeTab === 'admin-actions') {
      body = (<>
        <div className="border-b border-dark-800 pb-5 space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-72 h-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-40 h-5" />
                <Skeleton className="w-56 h-3" />
              </div>
              <Skeleton className="w-4 h-4" />
            </div>
          ))}
        </div>
      </>);

    } else if (activeTab === 'earnings') {
      body = (<>
        {skHeader(true)}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
              <div className="flex items-center justify-between gap-1">
                <Skeleton className="w-28 h-3" />
                <Skeleton className="w-4 h-4" />
              </div>
              <Skeleton className="w-36 h-8" />
              <Skeleton className="w-full h-3 border-t border-dark-800/80 pt-1" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 space-y-4">
          <Skeleton className="w-48 h-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Skeleton className="w-48 h-5" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-24 h-8 rounded-xl" />)}
            </div>
          </div>
          <Skeleton className="w-full h-9 rounded-xl" />
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2 border-b border-dark-800">
              {['w-24','w-32','w-20','w-28','w-20','w-24','w-16'].map((w, i) => (
                <Skeleton key={i} className={`${w} h-3 shrink-0`} />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-dark-800/60">
                {['w-24','w-32','w-20','w-28','w-20','w-24','w-16'].map((w, j) => (
                  <Skeleton key={j} className={`${w} h-4 shrink-0`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </>);

    } else if (activeTab === 'tasks') {
      body = (<>
        {skHeader(true)}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-dark-800 pb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-20 h-5 rounded-full" />
                    <Skeleton className="w-16 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-48 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-20 h-8 rounded-xl" />
                  <Skeleton className="w-24 h-8 rounded-xl" />
                  <Skeleton className="w-8 h-8 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="p-3 rounded-xl bg-dark-950 border border-dark-800/80 space-y-1">
                    <Skeleton className="w-10 h-3" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>);

    } else if (activeTab === 'add-task') {
      body = (<>
        <div className="border-b border-dark-800 pb-5 space-y-2">
          <Skeleton className="w-56 h-8" />
          <Skeleton className="w-72 h-4" />
        </div>
        <div className="p-6 rounded-3xl bg-dark-900/80 border border-dark-800 space-y-5">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-full h-12 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
          <Skeleton className="w-full h-24 rounded-xl" />
          <Skeleton className="w-full h-12 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </>);

    } else if (activeTab === 'categories') {
      body = (<>
        <div className="border-b border-dark-800 pb-5 space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-64 h-4" />
        </div>
        <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
          <Skeleton className="w-36 h-5" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="w-28 h-4" />
                <Skeleton className="w-40 h-3" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          ))}
        </div>
      </>);

    } else if (activeTab === 'submissions') {
      body = (<>
        <div className="border-b border-dark-800 pb-4 space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-80 h-4" />
        </div>
        <div className="flex items-center gap-2 border-b border-dark-800 pb-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-36 h-9 rounded-xl" />)}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="w-20 h-3" />
                  <Skeleton className="w-56 h-5" />
                  <Skeleton className="w-64 h-3" />
                </div>
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
              <Skeleton className="w-full h-16 rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="w-40 h-9 rounded-xl" />
                <Skeleton className="w-28 h-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </>);

    } else if (activeTab === 'wallets') {
      body = (<>
        {skHeader(true)}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => skMetricCard(i))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-24 h-8 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-9 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-9 rounded-xl" />
              <Skeleton className="flex-1 h-9 rounded-xl" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-28 h-4" />
                    <Skeleton className="w-16 h-4 rounded-full" />
                  </div>
                  <Skeleton className="w-56 h-3" />
                  <Skeleton className="w-40 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-24 h-8 rounded-xl" />
                  <Skeleton className="w-24 h-8 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>);

    } else if (activeTab === 'adverts') {
      body = (<>
        <div className="border-b border-dark-800 pb-4 space-y-2">
          <Skeleton className="w-56 h-8" />
          <Skeleton className="w-64 h-4" />
        </div>
        <div className="p-6 rounded-3xl bg-dark-900/80 border border-dark-800 space-y-4">
          <Skeleton className="w-36 h-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-36 h-5" />
                <Skeleton className="w-24 h-3" />
              </div>
              <div className="flex justify-between pt-2 border-t border-dark-800">
                <Skeleton className="w-16 h-8 rounded-xl" />
                <Skeleton className="w-8 h-8 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </>);

    } else if (activeTab === 'users') {
      body = (<>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-4">
          <div className="space-y-2">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-72 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-32 h-9 rounded-xl" />
            <Skeleton className="w-40 h-9 rounded-xl" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => skRowItem(i))}
        </div>
      </>);

    } else if (activeTab === 'packages') {
      body = (<>
        <div className="border-b border-dark-800 pb-4 space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-72 h-4" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 sm:p-6 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <Skeleton className="w-32 h-6" />
                <Skeleton className="w-20 h-8 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-full h-10 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>);

    } else if (activeTab === 'banners-social') {
      body = (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-800">
                <Skeleton className="w-40 h-6" />
                <Skeleton className="w-40 h-9 rounded-xl" />
              </div>
              <div className="p-4 rounded-xl border border-dark-800 space-y-3">
                <Skeleton className="w-full h-10 rounded-xl" />
                <Skeleton className="w-full h-10 rounded-xl" />
                <Skeleton className="w-full h-20 rounded-xl" />
                <Skeleton className="w-full h-10 rounded-xl" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="p-4 rounded-xl bg-dark-900/80 border border-dark-800 flex items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-48 h-3" />
                    </div>
                    <Skeleton className="w-16 h-7 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    } else if (activeTab === 'audit-logs') {
      body = (<>
        {skHeader(true)}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => skRowItem(i))}
        </div>
      </>);

    } else if (activeTab === 'admin-settings') {
      body = (<>
        <div className="border-b border-dark-800 pb-4 space-y-2">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-80 h-4" />
        </div>
        <div className="p-6 sm:p-8 rounded-3xl bg-dark-900/80 border border-dark-800 space-y-5 max-w-xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="w-36 h-3" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          ))}
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </>);

    } else {
      body = (<>
        {skHeader(true)}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => skMetricCard(i))}
        </div>
      </>);
    }

    return (
      <main className="flex-1 min-w-0 overflow-x-hidden lg:pl-64 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 max-w-7xl">
        <div className="space-y-6 animate-in fade-in duration-200">
          {body}
        </div>
      </main>
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

  // SIDEBAR NAVIGATION ITEMS MOVED TO LAYOUT
  return (
      <main className="flex-1 min-w-0 overflow-x-hidden lg:pl-64 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 max-w-7xl">
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

            {/* Quick Metrics Grid — 2-Column Mobile Grid Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Registered Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Total Users
                  <Users className="w-4 h-4 text-blue-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-white font-mono">
                  {loading ? <Skeleton className="w-20 h-8" /> : stats ? (stats.users?.total ?? 0).toLocaleString() : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : stats ? `${(stats.users?.verified ?? 0)} phone verified` : '—'}
                </span>
              </div>

              {/* Card 2: Active Users */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Active Users
                  <Users className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-white font-mono">
                  {loading ? <Skeleton className="w-20 h-8" /> : stats ? (stats.users?.active ?? 0).toLocaleString() : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : stats ? `${(stats.users?.suspended ?? 0)} suspended` : '—'}
                </span>
              </div>

              {/* Card 3: Total Activation Fees (from /api/admin/earnings) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Total Activation Fees
                  <Coins className="w-4 h-4 text-brand-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-white font-mono truncate">
                  {loading ? <Skeleton className="w-24 h-8" /> : earningsData?.stats ? `KES ${(earningsData.stats.totalActivationRevenue ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : earningsData?.stats ? `${(earningsData.stats.totalActivationPayments ?? 0)} paid activations` : '—'}
                </span>
              </div>

              {/* Card 4: Total Admin Earnings (from /api/admin/earnings) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-emerald-500/20 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-emerald-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Admin Earnings
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono truncate">
                  {loading ? <Skeleton className="w-24 h-8" /> : earningsData?.stats ? `KES ${(earningsData.stats.totalAdminEarnings ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : earningsData?.stats ? `Today: KES ${(earningsData.stats.todayAdminEarnings ?? 0).toLocaleString()}` : '—'}
                </span>
              </div>
              {/* Card 5: Users Referral Earnings (from /api/admin/earnings) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-cyan-500/20 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-cyan-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Users Referral Earnings
                  <Users className="w-4 h-4 text-cyan-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-cyan-300 font-mono truncate">
                  {loading ? <Skeleton className="w-24 h-8" /> : earningsData?.stats ? `KES ${(earningsData.stats.totalReferralRewardsPaid ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : 'Total referral rewards paid'}
                </span>
              </div>

              {/* Card 6: Users Tasks Earnings (from /api/admin/earnings) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-purple-500/20 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-purple-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Users Tasks Earnings
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-purple-300 font-mono truncate">
                  {loading ? <Skeleton className="w-24 h-8" /> : earningsData?.stats ? `KES ${(earningsData.stats.totalTaskRewardsPaid ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : 'Total task rewards paid'}
                </span>
              </div>

              {/* Card 6b: Total Payouts Paid (from /api/admin/stats) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-emerald-500/20 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-emerald-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Total Payouts Paid
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono truncate">
                  {loading ? <Skeleton className="w-24 h-8" /> : stats ? `KES ${(stats.wallets?.completedWithdrawalsKES ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : stats ? `${(stats.wallets?.completedWithdrawalsCount ?? 0)} successful payouts` : '—'}
                </span>
              </div>


              {/* Card 7: Pending Withdrawals (from /api/admin/stats) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Pending Payouts
                  <Wallet className="w-4 h-4 text-amber-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-white font-mono truncate">
                  {loading ? <Skeleton className="w-24 h-8" /> : stats ? `KES ${(stats.wallets?.pendingWithdrawalsKES ?? 0).toLocaleString()}` : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : stats ? `${(stats.wallets?.pendingWithdrawalsCount ?? 0)} awaiting review` : '—'}
                </span>
              </div>

              {/* Card 8: Pending Reviews (from /api/admin/stats) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Pending Reviews
                  <FileText className="w-4 h-4 text-amber-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-white font-mono">
                  {loading ? <Skeleton className="w-20 h-8" /> : stats ? (stats.submissions?.pendingReview ?? 0).toLocaleString() : '—'}
                </p>
                {loading ? <Skeleton className="w-32 h-4 mt-0.5" /> : (
                  <button
                    onClick={() => router.push('/admin?tab=submissions')}
                    className="text-[11px] text-brand-400 font-bold hover:underline flex items-center gap-1 cursor-pointer pt-0.5 truncate"
                  >
                    {stats ? `${(stats.submissions?.pendingTasks ?? 0)} task • ${(stats.submissions?.pendingWhatsapp ?? 0)} WA` : '—'} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Card 9: Users' Coins (from /api/admin/stats) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-brand-500/20 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-brand-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Users' Coins
                  <span className="text-sm">🪙</span>
                </span>
                <p className="text-xl sm:text-2xl font-black text-brand-300 font-mono">
                  {loading ? <Skeleton className="w-20 h-8" /> : stats ? (stats.wallets?.totalCoins ?? 0).toLocaleString() : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  {loading ? <Skeleton className="w-32 h-4" /> : 'Total unredeemed coins'}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TAB: ADMINISTRATIVE ACTIONS */}
        {activeTab === 'admin-actions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-dark-800 pb-5">
              <h1 className="text-2xl font-black text-white tracking-tight">Administrative Actions</h1>
              <p className="text-xs text-slate-400 mt-0.5">Quick access to core platform management tasks.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <button
                onClick={() => router.push('/admin?tab=add-task')}
                className="p-6 rounded-2xl bg-dark-900/80 hover:bg-brand-500/10 border border-dark-800 hover:border-brand-500/30 text-left transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                  <PlusCircle className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Create &amp; Publish Task</span>
                  <span className="text-xs text-slate-400 mt-0.5 block">Add tasks for users to complete and earn rewards</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
              </button>

              <button
                onClick={() => router.push('/admin?tab=submissions')}
                className="p-6 rounded-2xl bg-dark-900/80 hover:bg-amber-500/10 border border-dark-800 hover:border-amber-500/30 text-left transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Review Worker Submissions</span>
                  <span className="text-xs text-slate-400 mt-0.5 block">Approve or reject submitted task proof from workers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => router.push('/admin?tab=wallets')}
                className="p-6 rounded-2xl bg-dark-900/80 hover:bg-emerald-500/10 border border-dark-800 hover:border-emerald-500/30 text-left transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Review M-Pesa Payouts</span>
                  <span className="text-xs text-slate-400 mt-0.5 block">Process and approve pending M-Pesa withdrawal requests</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Total Activation Revenue */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between gap-1 min-w-0">
                  <span className="truncate" title="Activation Revenue">Activation Revenue</span>
                  <Coins className="w-4 h-4 text-brand-400 shrink-0" />
                </span>
                <p className="text-2xl font-black text-white font-mono">
                  {earningsLoading ? <Skeleton className="w-32 h-8" /> : `KES ${(earningsData?.stats?.totalActivationRevenue || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-dark-800/80">
                  {earningsLoading ? <Skeleton className="w-full h-4 mt-1" /> : (
                    <>
                      <span>{earningsData?.stats?.totalActivationPayments || 0} Paid Activations</span>
                      <span className="text-amber-400 font-bold">{earningsData?.stats?.pendingDepositsCount || 0} Pending</span>
                    </>
                  )}
                </div>
              </div>

              {/* 2. Admin Activation Earnings (KES 100/activation) */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-emerald-500/20 glow-emerald space-y-2">
                <span className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider flex items-center justify-between gap-1 min-w-0">
                  <span className="truncate" title="Admin Activation Earnings">Admin Activation Earnings</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                </span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {earningsLoading ? <Skeleton className="w-32 h-8" /> : `KES ${(earningsData?.stats?.totalAdminEarnings || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                </p>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-dark-800/80 flex items-center justify-between">
                  {earningsLoading ? <Skeleton className="w-full h-4 mt-1" /> : (
                    <>
                      <span>Today: KES {(earningsData?.stats?.todayAdminEarnings || 0).toLocaleString()}</span>
                      <span>Month: KES {(earningsData?.stats?.thisMonthAdminEarnings || 0).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 3. Referral Rewards Disbursed (KES 100/referral) */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-cyan-500/20 space-y-2">
                <span className="text-[11px] text-cyan-400 uppercase font-bold tracking-wider flex items-center justify-between gap-1 min-w-0">
                  <span className="truncate" title="Referral Rewards Paid">Referral Rewards Paid</span>
                  <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                </span>
                <p className="text-2xl font-black text-cyan-300 font-mono">
                  {earningsLoading ? <Skeleton className="w-32 h-8" /> : `KES ${(earningsData?.stats?.totalReferralRewardsPaid || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-dark-800/80">
                  {earningsLoading ? <Skeleton className="w-full h-4 mt-1" /> : 'KES 100 credited to referring user wallets'}
                </p>
              </div>

              {/* 4. Platform Retained Reserve */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-purple-500/20 space-y-2">
                <span className="text-[11px] text-purple-400 uppercase font-bold tracking-wider flex items-center justify-between gap-1 min-w-0">
                  <span className="truncate" title="Platform Retained Reserve">Platform Retained Reserve</span>
                  <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                </span>
                <p className="text-2xl font-black text-purple-300 font-mono">
                  {earningsLoading ? <Skeleton className="w-32 h-8" /> : `KES ${(earningsData?.stats?.totalPlatformRetained || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`}
                </p>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-dark-800/80">
                  {earningsLoading ? <Skeleton className="w-full h-4 mt-1" /> : 'Unreferred activations (100% balanced ledger)'}
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
                onClick={() => router.push('/admin?tab=add-task')}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/20"
              >
                <PlusCircle className="w-4 h-4" /> Add New Task
              </button>
            </div>

            {/* Task Management Table / Cards */}
            <div className="space-y-4">
              {tasksList === null ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-dark-800">
                      <div className="space-y-2">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-48 h-5" />
                      </div>
                      <Skeleton className="w-20 h-8" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {Array.from({ length: 7 }).map((_, j) => <Skeleton key={j} className="h-12" />)}
                    </div>
                  </div>
                ))
              ) : tasksList.length === 0 ? (
                <EmptyState
                  icon="clipboard"
                  title="No tasks yet"
                  description='Click "Add New Task" to create your first task.'
                />
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
                                : task.status === 'DRAFT'
                                ? 'bg-slate-700 text-slate-300 border border-slate-600'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.status === 'DRAFT' ? '✏ DRAFT' : task.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">{task.title}</h3>
                      </div>

                      {/* Management Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Edit button — for all tasks */}
                        <button
                          onClick={() => handleEditTask(task)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        
                        {/* Revert to Draft button — only for non-DRAFT tasks */}
                        {task.status !== 'DRAFT' && (
                          <button
                            onClick={() => handleRevertToDraft(task)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Revert to Draft"
                          >
                            To Draft
                          </button>
                        )}

                        {/* Publish / Pause toggle */}
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
                          title="Delete Task"
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white">
                    {editingTask ? 'Edit Draft Task' : 'Create New Task'}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingTask
                      ? `Editing: ${editingTask.title} — changes save to draft until published.`
                      : 'New tasks are saved as drafts by default. Publish them from the Task Management list.'}
                  </p>
                </div>
                {editingTask && (
                  <button
                    onClick={() => { resetTaskForm(); router.push('/admin?tab=tasks'); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-dark-800 text-slate-400 hover:text-white border border-dark-700 transition-colors cursor-pointer flex-shrink-0"
                  >
                    ✕ Cancel Edit
                  </button>
                )}
              </div>
              {editingTask && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  ✏ You are editing a draft task. Save your changes, then publish from the Task Management list.
                </div>
              )}
            </div>

            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-5 bg-dark-900/80 border border-dark-800 rounded-3xl p-6 sm:p-8">
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
                    {(categoriesList || []).map((cat) => (
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
                  <label className="text-xs font-semibold text-slate-300 uppercase">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="DRAFT">Draft (Hidden from users)</option>
                    <option value="PUBLISHED">Published (Live immediately)</option>
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

              <div className="flex gap-3">
                {editingTask && (
                  <button
                    type="button"
                    onClick={() => { resetTaskForm(); router.push('/admin?tab=tasks'); }}
                    className="flex-1 py-3.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 font-bold text-sm border border-dark-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="flex-1 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {taskSubmitting
                    ? (editingTask ? 'Saving Changes...' : 'Saving Task...')
                    : editingTask
                    ? 'Save Changes'
                    : taskForm.status === 'DRAFT'
                    ? 'Save as Draft'
                    : 'Publish Task to Marketplace'
                  }
                </button>
              </div>
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
              {categoriesList === null ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="w-28 h-4" />
                      <Skeleton className="w-40 h-3" />
                      <Skeleton className="w-20 h-3" />
                    </div>
                    <Skeleton className="w-16 h-8" />
                  </div>
                ))
              ) : categoriesList.length === 0 ? (
                <div className="col-span-3">
                  <EmptyState
                    icon="folder"
                    title="No categories yet"
                    description="Add your first task category using the form above."
                  />
                </div>
              ) : (
                categoriesList.map((cat) => (
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
                ))
              )}
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
              {submissionsFilterLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
                    <div className="flex items-start justify-between pb-3 border-b border-dark-800">
                      <div className="space-y-2">
                        <Skeleton className="w-20 h-3" />
                        <Skeleton className="w-56 h-5" />
                        <Skeleton className="w-64 h-3" />
                      </div>
                      <Skeleton className="w-20 h-6" />
                    </div>
                    <Skeleton className="w-full h-16" />
                    <div className="flex gap-3">
                      <Skeleton className="w-40 h-9" />
                      <Skeleton className="w-28 h-9" />
                    </div>
                  </div>
                ))
              ) : submissionsList.length === 0 ? (
                <EmptyState
                  icon="inbox"
                  title="Queue is clear"
                  description={`No ${submissionFilter === 'UNDER_REVIEW' ? 'pending' : submissionFilter.toLowerCase()} submissions at the moment.`}
                />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-4">
              <div>
                <h1 className="text-2xl font-black text-white">User Wallets & Withdrawals</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage worker withdrawal requests, review M-Pesa payout queues, and inspect user balances.
                </p>
                <p className="text-[10px] text-amber-500/70 italic mt-1">
                  Note: Platform aggregate stats include the admin wallet balance.
                </p>
              </div>
              <button
                onClick={fetchWithdrawals}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 self-start cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Summary Cards Grid — 2-Column Mobile Grid Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. Completed Count */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Completed Count
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {!withdrawalsError && withdrawalsList ? (withdrawalsList.filter(w => w.status === 'PAID' || w.status === 'COMPLETED').length ?? 0).toLocaleString() : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  Successful payouts
                </span>
              </div>

              {/* 2. Rejected Count */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Rejected Count
                  <XCircle className="w-4 h-4 text-rose-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                  {!withdrawalsError && withdrawalsList ? (withdrawalsList.filter(w => w.status === 'REJECTED').length ?? 0).toLocaleString() : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  Denied requests
                </span>
              </div>

              {/* 3. Total Paid Amount */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Total Paid
                  <Coins className="w-4 h-4 text-brand-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-white font-mono truncate">
                  {!withdrawalsError && withdrawalsList
                    ? `KES ${(withdrawalsList.filter(w => w.status === 'PAID' || w.status === 'COMPLETED').reduce((acc, w) => acc + (w.amount || 0), 0)).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
                    : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  Sum of paid withdrawals
                </span>
              </div>

              {/* 4. Processed Today */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-2">
                <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center justify-between">
                  Processed Today
                  <Calendar className="w-4 h-4 text-cyan-400" />
                </span>
                <p className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                  {!withdrawalsError && withdrawalsList ? (() => {
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    return withdrawalsList.filter(w => {
                      const d = new Date(w.processedAt || w.requestedAt);
                      return d >= startOfToday && (w.status === 'PAID' || w.status === 'COMPLETED' || w.status === 'REJECTED');
                    }).length.toLocaleString();
                  })() : '—'}
                </p>
                <span className="text-[11px] text-slate-400 block truncate">
                  Processed since midnight
                </span>
              </div>
            </div>

            {/* Filter & Search Bar Card */}
            <div className="p-4 rounded-3xl bg-dark-900 border border-dark-800 space-y-4">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-dark-800 pb-3">
                {[
                  { id: 'ALL', label: 'All Requests', count: withdrawalsList?.length ?? 0 },
                  { id: 'PENDING', label: 'Pending', count: withdrawalsList?.filter(w => w.status === 'PENDING').length ?? 0 },
                  { id: 'COMPLETED', label: 'Completed', count: withdrawalsList?.filter(w => w.status === 'PAID' || w.status === 'COMPLETED').length ?? 0 },
                  { id: 'REJECTED', label: 'Rejected', count: withdrawalsList?.filter(w => w.status === 'REJECTED').length ?? 0 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWithdrawalFilter(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      withdrawalFilter === tab.id
                        ? 'bg-brand-500 text-dark-950 shadow-md shadow-brand-500/20'
                        : 'bg-dark-800/60 text-slate-400 hover:text-white hover:bg-dark-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                      withdrawalFilter === tab.id ? 'bg-dark-950/20 text-dark-950' : 'bg-dark-950 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Date Range Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user, phone, M-Pesa..."
                    value={withdrawalSearch}
                    onChange={(e) => setWithdrawalSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-950 border border-dark-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  {withdrawalSearch && (
                    <button onClick={() => setWithdrawalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold shrink-0">From:</span>
                  <input
                    type="date"
                    value={withdrawalStartDate}
                    onChange={(e) => setWithdrawalStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold shrink-0">To:</span>
                  <input
                    type="date"
                    value={withdrawalEndDate}
                    onChange={(e) => setWithdrawalEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-dark-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Mobile-First Cards List */}
            <div className="space-y-3">
              {withdrawalsList === null ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <Skeleton className="w-40 h-5" />
                        <Skeleton className="w-32 h-3" />
                      </div>
                      <Skeleton className="w-20 h-6" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-24 h-8" />
                      <Skeleton className="w-28 h-3" />
                    </div>
                  </div>
                ))
              ) : filteredWithdrawals.length === 0 ? (
                <EmptyState
                  icon="wallet"
                  title="No withdrawal requests found"
                  description="Try adjusting your filters or search terms."
                />
              ) : (
                filteredWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 sm:p-5 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-3 hover:border-dark-700 transition-colors"
                  >
                    {/* Top Row: User details & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-sm truncate">
                            {w.user?.fullName || w.user?.username || 'Worker Account'}
                          </span>
                          <span className="text-xs text-brand-400 font-mono font-bold">
                            @{w.user?.username || 'user'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {formatKenyanPhoneDisplay(w.user?.phone || w.mpesaNumber)}
                          {w.user?.email ? ` • ${w.user.email}` : ''}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 border ${
                          w.status === 'PAID' || w.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : w.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>

                    {/* Details Grid: Amount, M-Pesa Number, Fee (if present), Dates */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-dark-950/60 border border-dark-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Amount</span>
                        <span className="font-mono font-black text-white text-sm">
                          KES {(w.amount ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">M-Pesa Number</span>
                        <span className="font-mono font-bold text-slate-300">
                          {formatKenyanPhoneDisplay(w.mpesaNumber)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Requested</span>
                        <span className="text-slate-400">
                          {new Date(w.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">
                          {(w.fee != null || w.withdrawalFee != null) ? 'Fee' : w.processedAt ? 'Processed' : 'Receipt'}
                        </span>
                        <span className="text-slate-400 font-mono truncate block">
                          {(w.fee != null || w.withdrawalFee != null)
                            ? `KSh ${w.fee ?? w.withdrawalFee}`
                            : w.processedAt
                            ? new Date(w.processedAt).toLocaleDateString()
                            : w.mpesaReceipt || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Notes / M-Pesa Receipt detail if present */}
                    {(w.adminNotes || w.mpesaReceipt) && (
                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                        {w.mpesaReceipt && (
                          <p><span className="text-slate-500 font-bold">M-Pesa Receipt:</span> <code className="text-emerald-400 font-mono">{w.mpesaReceipt}</code></p>
                        )}
                        {w.adminNotes && (
                          <p><span className="text-slate-500 font-bold">Admin Notes:</span> {w.adminNotes}</p>
                        )}
                      </div>
                    )}

                    {/* HARD RULE UNTOUCHED ACTION BUTTONS */}
                    {w.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-dark-800/80">
                        <button
                          onClick={() => {
                            if (window.confirm(`Confirm you have already sent KES ${w.amount} to ${w.mpesaNumber} via M-Pesa? This marks it PAID and cannot be undone.`)) {
                              handleUpdateWithdrawalStatus(w.id, 'PAID');
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-black text-xs cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Reject this withdrawal? KES ${w.amount} will be refunded to the user's wallet.`)) {
                              handleUpdateWithdrawalStatus(w.id, 'REJECTED');
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
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
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Duration (Seconds)</label>
                  <input
                    type="number"
                    placeholder="Duration (Secs)"
                    value={advertForm.durationSeconds}
                    onChange={(e) => setAdvertForm({ ...advertForm, durationSeconds: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Reward (KES)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Reward (KES)"
                    value={advertForm.reward}
                    onChange={(e) => setAdvertForm({ ...advertForm, reward: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Initial Status</label>
                  <select
                    value={advertForm.status}
                    onChange={(e) => setAdvertForm({ ...advertForm, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-dark-950 border border-dark-800 text-white text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="ACTIVE">Active (Published)</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                </div>
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
              {advertsList === null ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-3">
                    <Skeleton className="aspect-video w-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-20 h-3" />
                      <Skeleton className="w-36 h-5" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                    <div className="flex justify-between pt-2 border-t border-dark-800">
                      <Skeleton className="w-16 h-8" />
                      <Skeleton className="w-8 h-8" />
                    </div>
                  </div>
                ))
              ) : advertsList.length === 0 ? (
                <div className="col-span-3">
                  <EmptyState
                    icon="video"
                    title="No adverts published"
                    description="Create your first advert using the form above."
                  />
                </div>
              ) : (
                advertsList.map((ad) => (
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
                ))
              )}
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Active / Inactive sub-tabs */}
                <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-dark-800 text-xs">
                  {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setUserStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        userStatusFilter === f
                          ? 'bg-brand-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'INACTIVE' ? 'Inactive' : f === 'ALL' ? 'All' : 'Active'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-white text-xs w-full sm:w-48 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>


            <div className="space-y-3">
              {usersList === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-28 h-4" />
                        <Skeleton className="w-16 h-4" />
                      </div>
                      <Skeleton className="w-64 h-3" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                ))
              ) : (() => {
                const statusFiltered = userStatusFilter === 'ALL'
                  ? usersList
                  : userStatusFilter === 'INACTIVE'
                    ? usersList.filter(u => u.status === 'PENDING_ACTIVATION')
                    : usersList.filter(u => u.status === 'ACTIVE');
                const filtered = statusFiltered.filter(
                  (u) =>
                    !userSearch ||
                    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.phone?.includes(userSearch)
                );
                if (filtered.length === 0) {
                  return (
                    <EmptyState
                      icon="users"
                      title={userSearch ? 'No users match your search' : userStatusFilter === 'INACTIVE' ? 'No inactive users found' : 'No users registered yet'}
                      description={userSearch ? 'Try a different name, email, or phone number.' : userStatusFilter === 'INACTIVE' ? 'All registered users have completed activation.' : 'Users will appear here once they register.'}
                    />
                  );
                }
                return filtered.map((u) => (
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
                      <button
                        type="button"
                        onClick={() => handleUserBanToggle(u.id, u.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          u.status === 'SUSPENDED'
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30'
                        }`}
                      >
                        {u.status === 'SUSPENDED' ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* TAB 8: MEMBERSHIP PACKAGES */}
        {activeTab === 'packages' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={packagesError} onRetry={fetchPackages} onDismiss={() => setPackagesError('')} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-4">
              <div>
                <h1 className="text-2xl font-black text-white">Membership Packages</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure package prices, limits, and rewards. Changes take effect immediately for new purchases.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {packagesList === null ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-dark-900/80 border border-dark-800 space-y-4">
                    <Skeleton className="w-32 h-6" />
                    <Skeleton className="w-full h-12" />
                  </div>
                ))
              ) : packagesList.length === 0 ? (
                <EmptyState
                  icon="folder"
                  title="No packages found"
                  description="Membership packages have not been initialized in the database."
                />
              ) : (
                packagesList.map((pkg) => {
                  const isEditing = editingPackage?.id === pkg.id;
                  
                  return (
                    <div key={pkg.id} className="p-5 sm:p-6 rounded-2xl bg-dark-900/80 border border-dark-800 relative overflow-hidden transition-all hover:border-brand-500/30">
                      {isEditing ? (
                        <form onSubmit={handleUpdatePackage} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                            <h3 className="font-bold text-white flex items-center gap-2">
                              <Package className="w-4 h-4 text-brand-400" />
                              Edit {pkg.name} Package
                            </h3>
                            <button
                              type="button"
                              onClick={() => setEditingPackage(null)}
                              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-dark-800 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Package Name</label>
                              <input
                                type="text"
                                value={editingPackage.name}
                                onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Price (KES)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editingPackage.price}
                                onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration (Days)</label>
                              <input
                                type="number"
                                min="1"
                                value={editingPackage.durationDays}
                                onChange={(e) => setEditingPackage({ ...editingPackage, durationDays: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Tasks Limit</label>
                              <input
                                type="number"
                                min="0"
                                value={editingPackage.taskLimitDaily}
                                onChange={(e) => setEditingPackage({ ...editingPackage, taskLimitDaily: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Watch Ads Limit</label>
                              <input
                                type="number"
                                min="0"
                                value={editingPackage.watchAdsLimit}
                                onChange={(e) => setEditingPackage({ ...editingPackage, watchAdsLimit: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Tasks Limit</label>
                              <input
                                type="number"
                                min="0"
                                value={editingPackage.whatsappTasksLimit}
                                onChange={(e) => setEditingPackage({ ...editingPackage, whatsappTasksLimit: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Referral Bonus (KES)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={editingPackage.referralBonus}
                                onChange={(e) => setEditingPackage({ ...editingPackage, referralBonus: e.target.value })}
                                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-sm text-white focus:border-brand-500 outline-none"
                                required
                              />
                            </div>
                            <div className="space-y-1 flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer pb-2">
                                <input
                                  type="checkbox"
                                  checked={editingPackage.isActive}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                                  className="w-4 h-4 rounded border-dark-700 bg-dark-900 text-brand-500 focus:ring-brand-500/20"
                                />
                                <span className="text-sm text-white font-medium">Package is Active</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-black text-sm transition-colors shadow-lg shadow-brand-500/20"
                            >
                              Save Configuration
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-4 flex-1">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black text-white tracking-tight">{pkg.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${pkg.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                  {pkg.isActive ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                              <div className="text-2xl font-mono font-bold text-brand-400 mt-1">
                                KES {pkg.price.toLocaleString()} <span className="text-sm text-slate-400 font-sans font-medium">/ {pkg.durationDays} days</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-dark-950 p-3 rounded-xl border border-dark-800/50">
                              <div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Standard Tasks</div>
                                <div className="text-sm font-bold text-white">{pkg.taskLimitDaily} / day</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Watch Ads</div>
                                <div className="text-sm font-bold text-white">{pkg.watchAdsLimit} / day</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">WhatsApp Tasks</div>
                                <div className="text-sm font-bold text-white">{pkg.whatsappTasksLimit} / day</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Referral Bonus</div>
                                <div className="text-sm font-bold text-emerald-400 font-mono">KES {pkg.referralBonus.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="shrink-0 pt-1">
                            <button
                              onClick={() => setEditingPackage({ ...pkg })}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-dark-700 bg-dark-800 hover:bg-dark-700 text-white text-xs font-bold transition-colors"
                            >
                              Edit Package
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 9: BANNERS & SOCIAL LINKS */}
        {activeTab === 'banners-social' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Banners Management */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> Managed Banners
                </h2>
                {/* Placement Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPlacementFilter('landing');
                      setBannerForm((prev) => ({ ...prev, placement: 'landing' }));
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      bannerPlacementFilter === 'landing'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Landing Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPlacementFilter('home');
                      setBannerForm((prev) => ({ ...prev, placement: 'home' }));
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      bannerPlacementFilter === 'home'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dashboard (Home)
                  </button>
                </div>
              </div>

              {/* Banner Add / Edit Form */}
              <form
                onSubmit={editingBanner ? handleUpdateBanner : handleCreateBanner}
                className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase">
                    {editingBanner ? `Edit Banner (#${editingBanner.id.slice(0, 8)})` : `Add New ${bannerPlacementFilter === 'landing' ? 'Landing Page' : 'Dashboard'} Banner`}
                  </h3>
                  {editingBanner && (
                    <button
                      type="button"
                      onClick={() => setEditingBanner(null)}
                      className="text-[11px] text-rose-400 hover:underline font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Banner Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🔥 Earn KES 500 Daily completing simple verified tasks!"
                    value={editingBanner ? editingBanner.title || '' : bannerForm.title}
                    onChange={(e) =>
                      editingBanner
                        ? setEditingBanner({ ...editingBanner, title: e.target.value })
                        : setBannerForm({ ...bannerForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Subtitle (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Join 15,000+ active Kenyans"
                      value={editingBanner ? editingBanner.subtitle || '' : bannerForm.subtitle}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                          : setBannerForm({ ...bannerForm, subtitle: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Placement Location</label>
                    <select
                      value={editingBanner ? editingBanner.placement : bannerForm.placement}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, placement: e.target.value })
                          : setBannerForm({ ...bannerForm, placement: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="landing">Landing Page (Public)</option>
                      <option value="home">Dashboard Home (Authenticated)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Body Text / Announcement Details (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Additional context or campaign instructions..."
                    value={editingBanner ? editingBanner.body || '' : bannerForm.body}
                    onChange={(e) =>
                      editingBanner
                        ? setEditingBanner({ ...editingBanner, body: e.target.value })
                        : setBannerForm({ ...bannerForm, body: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Image URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={editingBanner ? editingBanner.imageUrl || '' : bannerForm.imageUrl}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, imageUrl: e.target.value })
                          : setBannerForm({ ...bannerForm, imageUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Image Alt Text (Optional)</label>
                    <input
                      type="text"
                      placeholder="Image description..."
                      value={editingBanner ? editingBanner.imageAlt || '' : bannerForm.imageAlt}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, imageAlt: e.target.value })
                          : setBannerForm({ ...bannerForm, imageAlt: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">CTA Button Label (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Create Account or Explore Tasks"
                      value={editingBanner ? editingBanner.ctaLabel || '' : bannerForm.ctaLabel}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, ctaLabel: e.target.value })
                          : setBannerForm({ ...bannerForm, ctaLabel: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Target URL (CTA or Link)</label>
                    <input
                      type="text"
                      placeholder="/register or /tasks or https://..."
                      value={editingBanner ? editingBanner.ctaUrl || editingBanner.linkUrl || '' : bannerForm.ctaUrl || bannerForm.linkUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (editingBanner) {
                          setEditingBanner({ ...editingBanner, ctaUrl: val, linkUrl: val });
                        } else {
                          setBannerForm({ ...bannerForm, ctaUrl: val, linkUrl: val });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Starts At (Schedule Start)</label>
                    <input
                      type="datetime-local"
                      value={
                        editingBanner
                          ? editingBanner.startsAt
                            ? new Date(editingBanner.startsAt).toISOString().slice(0, 16)
                            : ''
                          : bannerForm.startsAt
                      }
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, startsAt: e.target.value })
                          : setBannerForm({ ...bannerForm, startsAt: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Ends At (Schedule End)</label>
                    <input
                      type="datetime-local"
                      value={
                        editingBanner
                          ? editingBanner.endsAt
                            ? new Date(editingBanner.endsAt).toISOString().slice(0, 16)
                            : ''
                          : bannerForm.endsAt
                      }
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, endsAt: e.target.value })
                          : setBannerForm({ ...bannerForm, endsAt: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBanner ? editingBanner.isActive : bannerForm.isActive}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, isActive: e.target.checked })
                          : setBannerForm({ ...bannerForm, isActive: e.target.checked })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Active Banner</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-400">Sort Order:</label>
                    <input
                      type="number"
                      value={editingBanner ? editingBanner.sortOrder : bannerForm.sortOrder}
                      onChange={(e) =>
                        editingBanner
                          ? setEditingBanner({ ...editingBanner, sortOrder: parseInt(e.target.value) || 0 })
                          : setBannerForm({ ...bannerForm, sortOrder: parseInt(e.target.value) || 0 })
                      }
                      className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all"
                >
                  {editingBanner ? 'Save Banner Changes' : 'Add Banner Slide'}
                </button>
              </form>

              {/* Banners List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">
                  {bannerPlacementFilter === 'landing' ? 'Landing Page' : 'Dashboard'} Banners (
                  {(bannersList || []).filter((b) => (b.placement || 'landing') === bannerPlacementFilter).length})
                </h3>

                {(bannersList || [])
                  .filter((b) => (b.placement || 'landing') === bannerPlacementFilter)
                  .map((b, idx, list) => {
                    const now = new Date();
                    const starts = b.startsAt ? new Date(b.startsAt) : null;
                    const ends = b.endsAt ? new Date(b.endsAt) : null;
                    const isFuture = starts && starts > now;
                    const isExpired = ends && ends < now;

                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        ACTIVE
                      </span>
                    );
                    if (!b.isActive) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[10px]">
                          DISABLED
                        </span>
                      );
                    } else if (isFuture) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          SCHEDULED
                        </span>
                      );
                    } else if (isExpired) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          EXPIRED
                        </span>
                      );
                    }

                    const targetUrl = b.ctaUrl || b.linkUrl;

                    return (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handleReorderBanner(b.id, 'up', list)}
                                disabled={idx === 0}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderBanner(b.id, 'down', list)}
                                disabled={idx === list.length - 1}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{b.title}</span>
                                {statusBadge}
                              </div>

                              {b.subtitle && <p className="text-slate-300 text-xs mt-0.5">{b.subtitle}</p>}
                              {b.body && <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{b.body}</p>}

                              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                                {targetUrl && (
                                  <a
                                    href={targetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-400 hover:underline flex items-center gap-1 font-mono"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {b.ctaLabel ? `${b.ctaLabel} (${targetUrl})` : targetUrl}
                                  </a>
                                )}
                                {starts && <span>Starts: {starts.toLocaleString()}</span>}
                                {ends && <span>Ends: {ends.toLocaleString()}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleBanner(b.id, b.isActive)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                                b.isActive
                                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              }`}
                            >
                              {b.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingBanner(b)}
                              className="px-2.5 py-1 rounded bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 text-[10px] font-bold"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(b.id)}
                              className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Social Links Management */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 pb-4 border-b border-slate-800">
                <Share2 className="w-5 h-5 text-brand-400" /> Platform Social Media Links
              </h2>

              {/* Social Link Form */}
              <form
                onSubmit={editingSocialLink ? handleUpdateSocialLink : handleSaveSocialLink}
                className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase">
                    {editingSocialLink ? `Edit Social Link (#${editingSocialLink.id.slice(0, 8)})` : 'Add New Social Link'}
                  </h3>
                  {editingSocialLink && (
                    <button
                      type="button"
                      onClick={() => setEditingSocialLink(null)}
                      className="text-[11px] text-rose-400 hover:underline font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Platform *</label>
                    <select
                      value={editingSocialLink ? editingSocialLink.platform : socialForm.platform}
                      onChange={(e) => {
                        const val = e.target.value;
                        const defaultLabel = `${val.charAt(0).toUpperCase() + val.slice(1)} Channel`;
                        if (editingSocialLink) {
                          setEditingSocialLink({ ...editingSocialLink, platform: val, label: editingSocialLink.label || defaultLabel });
                        } else {
                          setSocialForm({ ...socialForm, platform: val, label: defaultLabel, icon_key: val });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="facebook">Facebook</option>
                      <option value="telegram">Telegram</option>
                      <option value="instagram">Instagram</option>
                      <option value="x">X (Twitter)</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="email">Email Support</option>
                      <option value="phone">Phone Helpline</option>
                      <option value="custom">Custom Link</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Icon Override (Optional)</label>
                    <select
                      value={editingSocialLink ? editingSocialLink.icon_key || '' : socialForm.icon_key || ''}
                      onChange={(e) =>
                        editingSocialLink
                          ? setEditingSocialLink({ ...editingSocialLink, icon_key: e.target.value })
                          : setSocialForm({ ...socialForm, icon_key: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="">Auto (Use Platform Icon)</option>
                      <option value="whatsapp">WhatsApp Icon</option>
                      <option value="facebook">Facebook Icon</option>
                      <option value="telegram">Telegram Icon</option>
                      <option value="instagram">Instagram Icon</option>
                      <option value="x">X / Twitter Icon</option>
                      <option value="tiktok">Video Icon</option>
                      <option value="youtube">YouTube Icon</option>
                      <option value="email">Mail Icon</option>
                      <option value="phone">Phone Icon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Display Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WhatsApp Official Group"
                    value={editingSocialLink ? editingSocialLink.label : socialForm.label}
                    onChange={(e) =>
                      editingSocialLink
                        ? setEditingSocialLink({ ...editingSocialLink, label: e.target.value })
                        : setSocialForm({ ...socialForm, label: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Full Target URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://chat.whatsapp.com/... or mailto:..."
                    value={editingSocialLink ? editingSocialLink.url : socialForm.url}
                    onChange={(e) =>
                      editingSocialLink
                        ? setEditingSocialLink({ ...editingSocialLink, url: e.target.value })
                        : setSocialForm({ ...socialForm, url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Placement Display Locations</label>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={
                          editingSocialLink
                            ? (editingSocialLink.placement || []).includes('community_row')
                            : socialForm.placement.includes('community_row')
                        }
                        onChange={(e) => {
                          const current = editingSocialLink
                            ? editingSocialLink.placement || []
                            : socialForm.placement;
                          const updated = e.target.checked
                            ? [...current, 'community_row']
                            : current.filter((p: string) => p !== 'community_row');
                          if (editingSocialLink) {
                            setEditingSocialLink({ ...editingSocialLink, placement: updated });
                          } else {
                            setSocialForm({ ...socialForm, placement: updated });
                          }
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span>Landing Page Community Pill Row</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={
                          editingSocialLink
                            ? (editingSocialLink.placement || []).includes('footer')
                            : socialForm.placement.includes('footer')
                        }
                        onChange={(e) => {
                          const current = editingSocialLink
                            ? editingSocialLink.placement || []
                            : socialForm.placement;
                          const updated = e.target.checked
                            ? [...current, 'footer']
                            : current.filter((p: string) => p !== 'footer');
                          if (editingSocialLink) {
                            setEditingSocialLink({ ...editingSocialLink, placement: updated });
                          } else {
                            setSocialForm({ ...socialForm, placement: updated });
                          }
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                      />
                      <span>Footer Column</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSocialLink ? editingSocialLink.isActive : socialForm.isActive}
                      onChange={(e) =>
                        editingSocialLink
                          ? setEditingSocialLink({ ...editingSocialLink, isActive: e.target.checked })
                          : setSocialForm({ ...socialForm, isActive: e.target.checked })
                      }
                      className="rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Active Social Link</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-400">Sort Order:</label>
                    <input
                      type="number"
                      value={editingSocialLink ? editingSocialLink.sort_order : socialForm.sort_order}
                      onChange={(e) =>
                        editingSocialLink
                          ? setEditingSocialLink({ ...editingSocialLink, sort_order: parseInt(e.target.value) || 0 })
                          : setSocialForm({ ...socialForm, sort_order: parseInt(e.target.value) || 0 })
                      }
                      className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold transition-all"
                >
                  {editingSocialLink ? 'Save Social Link Changes' : 'Add Social Link'}
                </button>
              </form>

              {/* Social Links List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">Configured Links ({(socialLinksList || []).length})</h3>

                {(socialLinksList || []).map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex flex-col gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleReorderSocialLink(s.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderSocialLink(s.id, 'down')}
                          disabled={idx === (socialLinksList || []).length - 1}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold uppercase text-[10px]">
                            {s.platform}
                          </span>
                          <span className="font-bold text-white text-sm">{s.label}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {s.isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-1 font-mono">{s.url}</p>

                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <span className="text-slate-400">Placements:</span>
                          {(s.placement || ['community_row']).map((p: string) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                              {p === 'community_row' ? 'Pill Row' : 'Footer'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSocialLink(s.id, s.isActive)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                          s.isActive
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {s.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSocialLink(s)}
                        className="px-2 py-1 rounded bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 text-[10px] font-bold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSocialLink(s.id)}
                        className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[10px] font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: SYSTEM AUDIT LOGS */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ErrorBanner error={auditLogsError} onRetry={fetchAuditLogs} onDismiss={() => setAuditLogsError('')} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
              <div>
                <h1 className="text-2xl font-black text-white">System Audit Logs</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological record of administrative actions taken on the platform.
                </p>
              </div>

              <button
                onClick={fetchAuditLogs}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 self-start cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="space-y-3">
              {auditLogsList === null ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-28 h-4" />
                        <Skeleton className="w-16 h-4" />
                      </div>
                      <Skeleton className="w-64 h-3" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                ))
              ) : auditLogsList.length === 0 ? (
                <EmptyState
                  icon="file"
                  title="No audit logs recorded"
                  description="Administrative actions will appear here."
                />
              ) : (
                auditLogsList.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800 flex flex-col md:flex-row md:items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{log.action}</span>
                        <span className="text-xs text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded-full">{log.adminEmail}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Target: <strong className="text-slate-300 font-mono">{log.targetUserEmail || log.targetEntityId || 'System'}</strong>
                      </p>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {log.details}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
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
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold tracking-wider uppercase text-slate-300">Loading Admin Panel...</p>
        </div>
      </div>
    }>
      <AdminDashboardInner />
    </Suspense>
  );
}
