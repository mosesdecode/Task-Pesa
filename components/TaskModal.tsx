'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  ExternalLink,
  Link as LinkIcon,
  Camera,
  Check,
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Ad Timer state
  const [adTimer, setAdTimer] = useState(item?.durationSeconds || 30);
  const [adTimerStarted, setAdTimerStarted] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  // Task Form state
  const [proofText, setProofText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [annotationAnswers, setAnnotationAnswers] = useState<Record<string, string>>({});

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
    return () => clearInterval(interval);
  }, [type, adTimerStarted, adTimer]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB size limit.');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file); // reuses clean avatar/image storage endpoint

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload screenshot proof');

      setProofUrl(data.profilePhoto);
      setSuccessMsg('Screenshot uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!proofText.trim() && !proofUrl.trim() && Object.keys(annotationAnswers).length === 0) {
      setError('Please provide proof of completion (written summary, screenshot, or URL).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${item.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofText: proofText.trim() || undefined,
          proofUrl: proofUrl.trim() || undefined,
          submissionDataJson: Object.keys(annotationAnswers).length > 0 ? annotationAnswers : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Task submission failed');

      setSuccessMsg('Task submitted successfully! It is now under quality review.');
      setTimeout(() => {
        onSuccess();
      }, 1000);
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
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {type === 'TASK'
                ? item.category?.name || 'Task Assignment'
                : type === 'AD'
                ? 'Sponsored Video Ad'
                : 'WhatsApp Status Campaign'}
            </span>
            <h3 className="text-xl font-extrabold text-white">{item.title || item.campaignName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
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
                  className="absolute flex items-center gap-3 px-6 py-3 rounded-full bg-brand-500 text-dark-900 font-extrabold shadow-2xl hover:scale-105 transition-transform cursor-pointer"
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
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
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

        {/* MODE B: GENERAL & ANNOTATION TASKS */}
        {type === 'TASK' && (
          <div className="space-y-6">
            {/* Instructions Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-400" /> Instructions
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Est. {item.durationSeconds || 120}s
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{item.instructions}</p>

              {item.rules && (
                <div className="pt-2 border-t border-slate-700/50 text-xs text-amber-300/90 space-y-1">
                  <strong className="text-amber-400 uppercase tracking-wider text-[10px] block">Task Rules:</strong>
                  <p>{item.rules}</p>
                </div>
              )}

              {item.externalUrl && (
                <div className="pt-2">
                  <a
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-colors"
                  >
                    <span>Open Task Resource / External Form</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Interactive Annotation Questions if payload exists */}
            {payloadData?.items?.map((taskItem: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40 space-y-3">
                <p className="text-xs font-bold text-brand-400">Question #{idx + 1}</p>
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
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
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

            {/* Proof of Work Submission Section */}
            <div className="space-y-4 border-t border-slate-800 pt-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Submit Your Proof of Work
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Requirement: {item.proofRequired || 'Submit text response, completion link, or screenshot proof.'}
                </p>
              </div>

              {/* Text Proof Response */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Written Response / Proof Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize your work or enter any required text answers..."
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Link / URL Proof */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Proof Link or Shared URL (Optional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Upload Screenshot Proof (Optional, max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand-400" />
                    {uploadingImage ? 'Uploading Image...' : 'Choose Screenshot Image'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {proofUrl && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono truncate max-w-[200px]">
                      <Check className="w-3 h-3" /> Image attached
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Reward and Submit Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-gray-400">Approval Reward</p>
                <p className="text-xl font-extrabold text-brand-400">KES {item.reward?.toFixed(2)}</p>
              </div>
              <button
                disabled={loading || uploadingImage}
                onClick={handleSubmitTask}
                className="px-6 py-3 rounded-xl font-black text-sm shadow-lg transition-all bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 shadow-brand-500/20 hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Submitting for Review...' : 'Submit Completed Task'}
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
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-brand-500/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
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
