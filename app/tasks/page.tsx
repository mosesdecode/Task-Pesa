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
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('all');
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

      const [taskRes, adRes, waRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/ads'),
        fetch('/api/whatsapp'),
      ]);

      const [taskData, adData, waData] = await Promise.all([
        taskRes.json(),
        adRes.json(),
        waRes.json(),
      ]);

      if (taskData.tasks) setTasks(taskData.tasks);
      if (taskData.categories) setCategories(taskData.categories);
      if (adData.ads) setAds(adData.ads);
      if (waData.campaigns) setWhatsappCampaigns(waData.campaigns);
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

  // Filter tasks based on search & category
  const filteredTasks = tasks.filter((t) => {
    const matchesCategory = activeTab === 'all' || t.category?.slug === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.instructions.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-[85vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <CheckSquare className="w-6 h-6" />
            </div>
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Browse published tasks, complete required instructions, and submit proof for quality review.
          </p>
        </div>

        {/* Search input */}
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

      {/* Category Tabs from Database */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          All Tasks ({tasks.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.slug)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === cat.slug
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        ))}

        <button
          onClick={() => setActiveTab('watch-ads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'watch-ads'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PlaySquare className="w-3.5 h-3.5" />
          Sponsored Ads ({ads.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp-promotions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'whatsapp-promotions'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          WhatsApp Promo ({whatsappCampaigns.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
          Loading available tasks...
        </div>
      ) : (
        <>
          {/* Section A: General Tasks */}
          {activeTab !== 'watch-ads' && activeTab !== 'whatsapp-promotions' && (
            <div>
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No Tasks Available in this Category</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    New tasks are published regularly by platform administrators and brand partners. Check back shortly.
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
                          {/* Top Tag & Remaining Slots */}
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                              {task.category?.name || 'Task'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {task.remainingSlots} / {task.totalSlots} slots
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                              {task.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {task.description || task.instructions}
                            </p>
                          </div>

                          {/* Submission Feedback if Rejected */}
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

                          {/* User Lifecycle Action Buttons */}
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

          {/* Section B: Watch Sponsored Ads */}
          {activeTab === 'watch-ads' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400">
                  No video ads currently active. Check back later.
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
                  >
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold font-mono">
                        {ad.durationSeconds}s
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">
                        {ad.advertiser}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{ad.title}</h3>
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
          {activeTab === 'whatsapp-promotions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatsappCampaigns.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400">
                  No promotional campaigns active at this time.
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
        </>
      )}

      {/* Task Modal for submissions and tasks */}
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
