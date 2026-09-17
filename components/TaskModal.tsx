'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Play,
  Clock,
  Download,
  Copy,
  Upload,
  BrainCircuit,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface TaskModalProps {
  item: any;
  type: 'TASK' | 'AD' | 'WHATSAPP';
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskModal({ item, type, onClose, onSuccess }: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ad Timer state
  const [adTimer, setAdTimer] = useState(item?.durationSeconds || 30);
  const [adTimerStarted, setAdTimerStarted] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  // Data Annotation Form state
  const [annotationAnswers, setAnnotationAnswers] = useState<Record<string, string>>({});
  const [taskTimer, setTaskTimer] = useState(item?.durationSeconds || 60);
  const [taskExpired, setTaskExpired] = useState(false);

  // WhatsApp Proof state
  const [whatsappProofUrl, setWhatsappProofUrl] = useState('');
  const [copiedCaption, setCopiedCaption] = useState(false);

  useEffect(() => {
    let interval: any;
    if (type === 'AD' && adTimerStarted && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev: number) => {
          if (prev <= 1) {
            setAdCompleted(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    if (type === 'TASK' && taskTimer > 0) {
      interval = setInterval(() => {
        setTaskTimer((prev: number) => {
          if (prev <= 1) {
            setTaskExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [type, adTimerStarted, adTimer, taskTimer]);

  const handleStartAd = () => {
    setAdTimerStarted(true);
  };

  const handleClaimAdReward = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ads/${item.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTimeSeconds: item.durationSeconds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify ad reward');

      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnnotation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${item.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionDataJson: annotationAnswers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Task submission failed');

      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWhatsappProof = async () => {
    if (!whatsappProofUrl) {
      setError('Please provide a screenshot proof link or upload');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/whatsapp/${item.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: whatsappProofUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Proof submission failed');

      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  let payloadData: any = {};
  if (type === 'TASK' && item?.dataPayloadJson) {
    try {
      payloadData = JSON.parse(item.dataPayloadJson);
    } catch (e) {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {type === 'TASK' ? 'Data Annotation Task' : type === 'AD' ? 'Sponsored Video Ad' : 'WhatsApp Status Campaign'}
            </span>
            <h3 className="text-xl font-extrabold text-white">{item.title || item.campaignName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE A: WATCH ADS */}
        {type === 'AD' && (
          <div className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-full object-cover opacity-80"
              />
              {!adTimerStarted ? (
                <button
                  onClick={handleStartAd}
                  className="absolute flex items-center gap-3 px-6 py-3 rounded-full bg-brand-500 text-dark-900 font-extrabold shadow-2xl hover:scale-105 transition-transform"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Watching ({item.durationSeconds}s)
                </button>
              ) : (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white font-mono text-sm font-bold">
                  <Clock className="w-4 h-4 text-brand-400 animate-spin" />
                  {adTimer > 0 ? `${adTimer}s remaining` : 'Viewing Completed!'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <div>
                <p className="text-xs text-gray-400 font-medium">Verified Reward</p>
                <p className="text-lg font-black text-brand-400">KES {item.reward?.toFixed(2)}</p>
              </div>
              <button
                disabled={!adCompleted || loading}
                onClick={handleClaimAdReward}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  adCompleted
                    ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white hover:scale-105 shadow-lg shadow-brand-500/20'
                    : 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {loading ? 'Claiming...' : adCompleted ? 'Claim Reward KES ' + item.reward : 'Watch Required Duration First'}
              </button>
            </div>
          </div>
        )}

        {/* MODE B: DATA ANNOTATION */}
        {type === 'TASK' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Instructions</h4>
                <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${taskExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-500/20 text-brand-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {taskExpired ? 'TIME EXPIRED' : `${Math.floor(taskTimer / 60)}:${(taskTimer % 60).toString().padStart(2, '0')}`}
                </div>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{item.instructions}</p>
            </div>

            {/* Dynamic Items */}
            {payloadData?.items?.map((taskItem: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40 space-y-3">
                <p className="text-xs font-bold text-brand-400">Item #{idx + 1}</p>
                {taskItem.url && (
                  <img
                    src={taskItem.url}
                    alt={`Task item ${idx}`}
                    className="w-full h-48 object-cover rounded-xl border border-slate-700"
                  />
                )}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {taskItem.options?.map((opt: string) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnnotationAnswers({ ...annotationAnswers, [`item_${idx}`]: opt })}
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                        annotationAnswers[`item_${idx}`] === opt
                          ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                          : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {payloadData?.sentences?.map((sentence: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40 space-y-3">
                <p className="text-sm italic text-gray-100 font-medium">"{sentence.text}"</p>
                <div className="flex gap-2">
                  {sentence.options?.map((opt: string) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnnotationAnswers({ ...annotationAnswers, [`sentence_${idx}`]: opt })}
                      className={`flex-1 p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        annotationAnswers[`sentence_${idx}`] === opt
                          ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                          : 'bg-slate-800/60 border-slate-700 text-gray-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-gray-400">Completion Reward</p>
                <p className="text-lg font-extrabold text-brand-400">KES {item.reward?.toFixed(2)}</p>
              </div>
              <button
                disabled={loading || taskExpired}
                onClick={handleSubmitAnnotation}
                className={`px-6 py-3 rounded-xl font-extrabold text-sm shadow-lg transition-all ${
                  taskExpired
                    ? 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white shadow-brand-500/20 hover:scale-105'
                }`}
              >
                {loading ? 'Submitting...' : taskExpired ? 'Time Expired' : 'Submit Annotation Work'}
              </button>
            </div>
          </div>
        )}

        {/* MODE C: WHATSAPP CAMPAIGN */}
        {type === 'WHATSAPP' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campaign Steps</h4>
              <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1.5 leading-relaxed">
                <li>Download the approved poster media asset below.</li>
                <li>Copy the official promotional caption.</li>
                <li>Post it to your WhatsApp Status for at least 12 hours.</li>
                <li>Upload screenshot proof showing your status post and view count.</li>
              </ol>
            </div>

            {/* Poster Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">Promotional Poster</label>
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-48 bg-slate-950">
                <img src={item.mediaUrl} alt="Poster" className="w-full h-full object-cover" />
                <a
                  href={item.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold hover:bg-black"
                >
                  <Download className="w-4 h-4" />
                  Download Poster
                </a>
              </div>
            </div>

            {/* Caption Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400">Caption Text</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.caption)}
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCaption ? 'Copied!' : 'Copy Caption'}
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-gray-300 font-mono select-all">
                {item.caption}
              </div>
            </div>

            {/* Proof Upload Link input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400">Screenshot Proof Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://imgur.com/your-screenshot.jpg"
                  value={whatsappProofUrl}
                  onChange={(e) => setWhatsappProofUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-gray-400">Campaign Reward</p>
                <p className="text-lg font-extrabold text-brand-400">KES {item.reward?.toFixed(2)}</p>
              </div>
              <button
                disabled={loading}
                onClick={handleSubmitWhatsappProof}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
              >
                {loading ? 'Submitting Proof...' : 'Submit Screenshot Proof'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
