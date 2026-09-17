'use client';

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  CheckSquare,
  PlaySquare,
  Share2,
  Users,
  Search,
  Filter,
  Sparkles,
  Clock,
  Zap,
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';

export default function TaskMarketplace() {
  const [activeTab, setActiveTab] = useState('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item for TaskModal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'TASK' | 'AD' | 'WHATSAPP'>('TASK');

  const fetchData = async () => {
    setLoading(true);
    try {
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
      if (adData.ads) setAds(adData.ads);
      if (waData.campaigns) setWhatsappCampaigns(waData.campaigns);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openTaskModal = (item: any, type: 'TASK' | 'AD' | 'WHATSAPP') => {
    setSelectedItem(item);
    setModalType(type);
  };

  const handleTaskSuccess = () => {
    setSelectedItem(null);
    fetchData();
  };

  const tabs = [
    { id: 'all', label: 'All Tasks', icon: Zap },
    { id: 'data-annotation', label: 'Data Annotation', icon: BrainCircuit },
    { id: 'watch-ads', label: 'Watch Ads', icon: PlaySquare },
    { id: 'whatsapp-promotions', label: 'WhatsApp Promo', icon: Share2 },
    { id: 'microtasks', label: 'Microtasks', icon: CheckSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white">Task Marketplace</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Browse verified digital tasks, watch sponsored ads, and participate in promotional campaigns.
        </p>
      </div>

      {/* Filter Tabs (Requirement 13) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-500 text-dark-900 shadow-lg shadow-brand-500/20'
                  : 'bg-slate-800/60 text-gray-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* SECTION A: DATA ANNOTATION & MICROTASKS */}
          {(activeTab === 'all' || activeTab === 'data-annotation' || activeTab === 'microtasks') && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-brand-400" />
                Data Annotation & Microtasks ({tasks.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {task.category?.name || 'Microtask'}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-gray-500" />
                          ~{Math.round(task.durationSeconds / 60)} min
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white leading-snug">{task.title}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{task.instructions}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">Reward</p>
                        <p className="text-xl font-black text-brand-400">KES {task.reward.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => openTaskModal(task, 'TASK')}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-dark-900 text-white font-extrabold text-xs transition-all border border-slate-700"
                      >
                        Start Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION B: WATCH ADS */}
          {(activeTab === 'all' || activeTab === 'watch-ads') && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <PlaySquare className="w-5 h-5 text-brand-400" />
                Sponsored Video Advertisements ({ads.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                        <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-brand-400 font-bold">
                          {ad.durationSeconds}s duration
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-gray-400">{ad.advertiser}</span>
                        <h4 className="text-sm font-bold text-white leading-snug">{ad.title}</h4>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">Ad Reward</p>
                        <p className="text-xl font-black text-brand-400">KES {ad.reward.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => openTaskModal(ad, 'AD')}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-dark-900 text-white font-extrabold text-xs transition-all border border-slate-700"
                      >
                        Watch Ad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION C: WHATSAPP PROMO CAMPAIGNS */}
          {(activeTab === 'all' || activeTab === 'whatsapp-promotions') && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand-400" />
                WhatsApp Status Campaigns ({whatsappCampaigns.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {whatsappCampaigns.map((wa) => (
                  <div
                    key={wa.id}
                    className="p-6 rounded-3xl glass-card glass-card-hover flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          WhatsApp Promo
                        </span>
                        <span className="text-[10px] text-gray-400">{wa.maxParticipants} slots max</span>
                      </div>
                      <h4 className="text-base font-bold text-white leading-snug">{wa.campaignName}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{wa.instructions}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400">Campaign Reward</p>
                        <p className="text-xl font-black text-brand-400">KES {wa.reward.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => openTaskModal(wa, 'WHATSAPP')}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-brand-500 hover:text-dark-900 text-white font-extrabold text-xs transition-all border border-slate-700"
                      >
                        Participate & Upload Proof
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Modal Container */}
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
