'use client';

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  CheckSquare,
  PlaySquare,
  Share2,
  Search,
  Filter,
  Sparkles,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Smartphone,
  FileText,
  RotateCcw,
  Check,
  FolderOpen,
  Eye,
} from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import TaskModal from '@/components/TaskModal';

type LifecycleTab = 'AVAILABLE' | 'PENDING' | 'APPROVED' | 'REJECTED';

// Helper to resolve an appropriate icon for each category
const getCategoryIcon = (slug?: string, name?: string) => {
  const s = `${slug || ''} ${name || ''}`.toLowerCase();
  if (s.includes('watch-ad') || s.includes('ad')) return PlaySquare;
  if (s.includes('whatsapp')) return Share2;
  if (s.includes('app')) return Smartphone;
  if (s.includes('transcription') || s.includes('audio')) return FileText;
  if (s.includes('data') || s.includes('annotation') || s.includes('image') || s.includes('label')) return BrainCircuit;
  if (s.includes('survey')) return CheckSquare;
  if (s.includes('comparison') || s.includes('product')) return Layers;
  if (s.includes('web')) return Zap;
  return Sparkles;
};

export default function TasksPage() {
  const [lifecycleTab, setLifecycleTab] = useState<LifecycleTab>('AVAILABLE');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  // Selected item for TaskModal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'TASK' | 'AD' | 'WHATSAPP'>('TASK');

  const [user, setUser] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        window.location.href = '/login?redirect=/tasks';
        return;
      }
      const meData = await meRes.json();
      if (!meData.user) {
        window.location.href = '/login?redirect=/tasks';
        return;
      }
      setUser(meData.user);

      // Single request replaces three separate /api/tasks, /api/ads, /api/whatsapp calls
      const dashRes = await fetch('/api/dashboard');
      const dashData = await dashRes.json();

      if (dashData.tasks) setTasks(dashData.tasks);
      if (dashData.categories) setCategories(dashData.categories);
      if (dashData.ads) setAds(dashData.ads);
      if (dashData.campaigns) setWhatsappCampaigns(dashData.campaigns);
    } catch (e) {
      console.error(e);
      window.location.href = '/login?redirect=/tasks';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartTask = async (task: any) => {
    setStartingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}/start`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        openTaskModal(task, 'TASK');
        fetchData();
      } else {
        alert(data.error || 'Failed to start task');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStartingTaskId(null);
    }
  };

  const openTaskModal = (item: any, type: 'TASK' | 'AD' | 'WHATSAPP') => {
    setSelectedItem(item);
    setModalType(type);
  };

  const handleTaskSuccess = () => {
    setSelectedItem(null);
    fetchData();
  };

  // ── Derived Submission Collections ──
  const pendingTasks = tasks.filter((t) => t.userStatus === 'UNDER_REVIEW' || t.userStatus === 'SUBMITTED');
  const pendingWa = whatsappCampaigns.filter((c) => c.submissions?.[0]?.status === 'PENDING');
  const totalPending = pendingTasks.length + pendingWa.length;

  const approvedTasks = tasks.filter((t) => t.userStatus === 'APPROVED');
  const approvedWa = whatsappCampaigns.filter((c) => c.submissions?.[0]?.status === 'APPROVED');
  const totalApproved = approvedTasks.length + approvedWa.length;

  const rejectedTasks = tasks.filter((t) => t.userStatus === 'REJECTED');
  const rejectedWa = whatsappCampaigns.filter((c) => c.submissions?.[0]?.status === 'REJECTED');
  const totalRejected = rejectedTasks.length + rejectedWa.length;

  // Only show tasks that are truly available: not yet acted on by the user, with slots open
  const availableTasks = tasks.filter((t) => {
    const status = t.userStatus || 'NOT_STARTED';
    return status === 'NOT_STARTED' && t.remainingSlots > 0;
  });

  // Filter available tasks based on search & category (for AVAILABLE view)
  const filteredTasks = availableTasks.filter((t) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      t.category?.slug === selectedCategory ||
      t.categoryId === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instructions && t.instructions.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Clean regular categories list (excluding separate custom tabs)
  const standardCategories = categories.filter(
    (c) => c.slug !== 'watch-ads' && c.slug !== 'whatsapp-promotions'
  );

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-[85vh]">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <CheckSquare className="w-6 h-6" />
            </div>
            Tasks Hub
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Browse available tasks by category, track submitted proof, and monitor quality review payouts.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* ── Top Lifecycle Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {/* Tab 1: Available Tasks */}
        <button
          onClick={() => setLifecycleTab('AVAILABLE')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            lifecycleTab === 'AVAILABLE'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Available Tasks</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              lifecycleTab === 'AVAILABLE'
                ? 'bg-slate-950/20 text-slate-950'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {availableTasks.length}
          </span>
        </button>

        {/* Tab 2: Submitted / Pending Review */}
        <button
          onClick={() => setLifecycleTab('PENDING')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            lifecycleTab === 'PENDING'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Submitted (Pending Review)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              lifecycleTab === 'PENDING'
                ? 'bg-slate-950/20 text-slate-950'
                : totalPending > 0
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalPending}
          </span>
        </button>

        {/* Tab 3: Approved */}
        <button
          onClick={() => setLifecycleTab('APPROVED')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            lifecycleTab === 'APPROVED'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              lifecycleTab === 'APPROVED'
                ? 'bg-slate-950/20 text-slate-950'
                : totalApproved > 0
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalApproved}
          </span>
        </button>

        {/* Tab 4: Rejected */}
        <button
          onClick={() => setLifecycleTab('REJECTED')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
            lifecycleTab === 'REJECTED'
              ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>Rejected</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              lifecycleTab === 'REJECTED'
                ? 'bg-slate-950/20 text-slate-950'
                : totalRejected > 0
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalRejected}
          </span>
        </button>
      </div>

      {/* ── Main Content Area ── */}
      {loading ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Skeleton Category Overview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-md" />
                <Skeleton className="w-32 h-4 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <Skeleton className="w-8 h-8 rounded-xl" />
                    <Skeleton className="w-6 h-4 rounded-full" />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <Skeleton className="w-20 h-3 rounded-md" />
                    <Skeleton className="w-14 h-2.5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Task Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-20 h-5 rounded-full" />
                    <Skeleton className="w-16 h-4 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="w-3/4 h-5 rounded-md" />
                    <Skeleton className="w-full h-3 rounded-md" />
                    <Skeleton className="w-5/6 h-3 rounded-md" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="w-12 h-3 rounded-md" />
                    <Skeleton className="w-20 h-6 rounded-md" />
                  </div>
                  <Skeleton className="w-28 h-9 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════
              VIEW 1: AVAILABLE TASKS (With Category Cards / Boxes)
          ══════════════════════════════════════════════════════════ */}
          {lifecycleTab === 'AVAILABLE' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Category Overview Boxes Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-brand-400" />
                    <span>Task Categories</span>
                  </h2>
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs font-bold text-brand-400 hover:text-brand-300 underline cursor-pointer"
                    >
                      Reset Filter (Show All)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* All Tasks Box */}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {availableTasks.length}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">All Categories</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Explore full catalog</div>
                    </div>
                  </button>

                  {/* Standard Categories Boxes */}
                  {standardCategories.map((cat) => {
                    const Icon = getCategoryIcon(cat.slug, cat.name);
                    const catTasks = availableTasks.filter(
                      (t) => t.categoryId === cat.id || t.category?.slug === cat.slug
                    );
                    const isSelected = selectedCategory === cat.slug;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-500/15 border-brand-500 shadow-md shadow-brand-500/10'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-brand-400 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                            {catTasks.length}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white line-clamp-1">{cat.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {catTasks.length} available
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Special Box 1: Sponsored Video Ads */}
                  <button
                    onClick={() => setSelectedCategory('watch-ads')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                      selectedCategory === 'watch-ads'
                        ? 'bg-blue-500/20 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <PlaySquare className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {ads.length}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">Sponsored Ads</div>
                      <div className="text-[10px] text-blue-400 mt-0.5 font-mono">
                        {ads.length} video ads
                      </div>
                    </div>
                  </button>

                  {/* Special Box 2: WhatsApp Promo */}
                  <button
                    onClick={() => setSelectedCategory('whatsapp-promotions')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition-all cursor-pointer ${
                      selectedCategory === 'whatsapp-promotions'
                        ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {whatsappCampaigns.length}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">WhatsApp Promo</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                        {whatsappCampaigns.length} campaigns
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Active Tasks Feed ── */}
              <div>
                {/* Section A: Regular Tasks */}
                {selectedCategory !== 'watch-ads' && selectedCategory !== 'whatsapp-promotions' && (
                  <div>
                    {filteredTasks.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                          <CheckSquare className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">No Tasks Available in this Selection</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          New microtasks and annotation jobs are published regularly. Select another category box above.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTasks.map((task) => {
                          const status = task.userStatus || 'NOT_STARTED';
                          const sub = task.userSubmission;

                          return (
                            <div
                              key={task.id}
                              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-lg group backdrop-blur-md"
                            >
                              <div className="space-y-3">
                                {/* Top Category Badge & Slots */}
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                    {task.category?.name || 'Task'}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {task.remainingSlots} / {task.totalSlots} slots
                                  </span>
                                </div>

                                {/* Title & Instructions */}
                                <div>
                                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                                    {task.title}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {task.description || task.instructions}
                                  </p>
                                </div>

                                {/* Rejection Feedback if any */}
                                {status === 'REJECTED' && sub?.rejectionReason && (
                                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
                                    <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-400">
                                      Rejection Feedback:
                                    </span>
                                    <p className="line-clamp-2 italic">"{sub.rejectionReason}"</p>
                                  </div>
                                )}
                              </div>

                              {/* Bottom Reward & Action */}
                              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                                    Reward
                                  </span>
                                  <span className="text-lg font-black text-brand-400">
                                    KES {task.reward.toFixed(2)}
                                  </span>
                                </div>

                                {/* User Action Buttons */}
                                {status === 'NOT_STARTED' && (
                                  <button
                                    onClick={() => handleStartTask(task)}
                                    disabled={startingTaskId === task.id || task.remainingSlots <= 0}
                                    className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                                  >
                                    <span>{startingTaskId === task.id ? 'Starting...' : 'Start Task'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {status === 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => openTaskModal(task, 'TASK')}
                                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                                  >
                                    <span>Submit Proof</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {status === 'UNDER_REVIEW' && (
                                  <div className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                                    <span>Under Review</span>
                                  </div>
                                )}

                                {status === 'APPROVED' && (
                                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Approved</span>
                                  </div>
                                )}

                                {status === 'REJECTED' && (
                                  <button
                                    onClick={() => openTaskModal(task, 'TASK')}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Resubmit
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Section B: Sponsored Ads */}
                {selectedCategory === 'watch-ads' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.length === 0 ? (
                      <div className="col-span-full p-12 text-center text-slate-400 rounded-3xl bg-slate-900/60 border border-slate-800">
                        No video advertisements currently available. Please check back later.
                      </div>
                    ) : (
                      ads.map((ad) => (
                        <div
                          key={ad.id}
                          className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
                        >
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                              src={ad.mediaUrl}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-brand-500/90 text-slate-950 flex items-center justify-center font-bold">
                                <PlaySquare className="w-6 h-6 ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 text-[10px] text-white font-mono">
                              {ad.durationSeconds}s
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white">{ad.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ad.description}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Reward</span>
                              <span className="text-base font-black text-brand-400">
                                KES {ad.reward.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => openTaskModal(ad, 'AD')}
                              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <PlaySquare className="w-3.5 h-3.5" />
                              Watch & Earn
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Section C: WhatsApp Status Campaigns */}
                {selectedCategory === 'whatsapp-promotions' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {whatsappCampaigns.length === 0 ? (
                      <div className="col-span-full p-12 text-center text-slate-400 rounded-3xl bg-slate-900/60 border border-slate-800">
                        No WhatsApp campaigns currently active. Please check back later.
                      </div>
                    ) : (
                      whatsappCampaigns.map((camp) => (
                        <div
                          key={camp.id}
                          className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
                        >
                          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                              src={camp.mediaUrl}
                              alt={camp.campaignName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-white">{camp.campaignName}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">{camp.instructions}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Reward</span>
                              <span className="text-base font-black text-brand-400">
                                KES {camp.reward.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => openTaskModal(camp, 'WHATSAPP')}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Participate
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 2: SUBMITTED (PENDING QUALITY REVIEW)
          ══════════════════════════════════════════════════════════ */}
          {lifecycleTab === 'PENDING' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0 text-amber-400" />
                <span>
                  The tasks below have been submitted and are currently in the administrator review queue. Rewards will credit automatically to your wallet upon approval.
                </span>
              </div>

              {totalPending === 0 ? (
                <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Pending Submissions</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      You do not have any tasks currently awaiting review. Go to the "Available Tasks" tab to complete tasks and earn instant cash!
                    </p>
                  </div>
                  <button
                    onClick={() => setLifecycleTab('AVAILABLE')}
                    className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-brand-400 transition-colors"
                  >
                    Browse Available Tasks
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Regular Tasks in Review */}
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            {task.category?.name || 'Task'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>In Review</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{task.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description || task.instructions}</p>
                        </div>

                        {task.userSubmission?.proofUrl && (
                          <div className="pt-2">
                            <a
                              href={task.userSubmission.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Submitted Proof
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                            Pending Payout
                          </span>
                          <span className="text-base font-black text-amber-400">
                            KES {task.reward.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {task.userSubmission?.submittedAt
                            ? new Date(task.userSubmission.submittedAt).toLocaleDateString()
                            : 'Submitted'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* WhatsApp Campaigns in Review */}
                  {pendingWa.map((camp) => (
                    <div
                      key={camp.id}
                      className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            WhatsApp Promo
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>In Review</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{camp.campaignName}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{camp.instructions}</p>
                        </div>

                        {camp.submissions?.[0]?.proofUrl && (
                          <div className="pt-2">
                            <a
                              href={camp.submissions[0].proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Status Screenshot
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                            Pending Payout
                          </span>
                          <span className="text-base font-black text-amber-400">
                            KES {camp.reward.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {camp.submissions?.[0]?.submittedAt
                            ? new Date(camp.submissions[0].submittedAt).toLocaleDateString()
                            : 'Submitted'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 3: APPROVED TASKS
          ══════════════════════════════════════════════════════════ */}
          {lifecycleTab === 'APPROVED' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                <span>
                  All tasks below have been approved by administrators and credited directly to your available wallet balance.
                </span>
              </div>

              {totalApproved === 0 ? (
                <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Approved Tasks Yet</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Complete tasks and submit proof to receive rewards. Approved earnings will be tracked here.
                    </p>
                  </div>
                  <button
                    onClick={() => setLifecycleTab('AVAILABLE')}
                    className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs cursor-pointer hover:bg-brand-400 transition-colors"
                  >
                    Start Earning
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Regular Approved Tasks */}
                  {approvedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            {task.category?.name || 'Task'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved & Credited</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{task.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description || task.instructions}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                            Earned Reward
                          </span>
                          <span className="text-lg font-black text-emerald-400">
                            + KES {task.reward.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {task.userSubmission?.reviewedAt
                            ? new Date(task.userSubmission.reviewedAt).toLocaleDateString()
                            : 'Approved'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* WhatsApp Approved Campaigns */}
                  {approvedWa.map((camp) => (
                    <div
                      key={camp.id}
                      className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            WhatsApp Promo
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved & Credited</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{camp.campaignName}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{camp.instructions}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                            Earned Reward
                          </span>
                          <span className="text-lg font-black text-emerald-400">
                            + KES {camp.reward.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 4: REJECTED TASKS
          ══════════════════════════════════════════════════════════ */}
          {lifecycleTab === 'REJECTED' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>
                  Submissions below were rejected during review. Check the administrator feedback on each card, fix the issue, and resubmit to claim your reward.
                </span>
              </div>

              {totalRejected === 0 ? (
                <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">No Rejected Submissions</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      All your submissions meet quality verification standards. Keep up the great work!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Regular Rejected Tasks */}
                  {rejectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            {task.category?.name || 'Task'}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{task.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description || task.instructions}</p>
                        </div>

                        {/* Rejection Feedback Banner */}
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs space-y-1">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-rose-400 block">
                            Admin Rejection Feedback:
                          </span>
                          <p className="italic">
                            "{task.userSubmission?.rejectionReason || 'Proof does not satisfy instructions requirements.'}"
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                            Potential Reward
                          </span>
                          <span className="text-base font-black text-rose-400">
                            KES {task.reward.toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => openTaskModal(task, 'TASK')}
                          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resubmit Proof</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* WhatsApp Rejected Campaigns */}
                  {rejectedWa.map((camp) => (
                    <div
                      key={camp.id}
                      className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            WhatsApp Promo
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white">{camp.campaignName}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{camp.instructions}</p>
                        </div>

                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs space-y-1">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-rose-400 block">
                            Admin Rejection Feedback:
                          </span>
                          <p className="italic">
                            "{camp.submissions?.[0]?.adminNotes || 'Proof screenshot was invalid or unreadable.'}"
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                            Potential Reward
                          </span>
                          <span className="text-base font-black text-rose-400">
                            KES {camp.reward.toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => openTaskModal(camp, 'WHATSAPP')}
                          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resubmit Proof</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Task / Ad / WhatsApp Modal ── */}
      {selectedItem && (
        <TaskModal
          item={selectedItem}
          type={modalType}
          onClose={() => setSelectedItem(null)}
          onSuccess={handleTaskSuccess}
        />
      )}
    </div>
  );
}
