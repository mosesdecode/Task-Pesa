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
  Image as ImageIcon,
  Trash2,
  HelpCircle,
  XCircle,
  Award,
  Zap,
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

  // Standard Task Form state
  const [proofText, setProofText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp Proof state
  const [whatsappProofUrl, setWhatsappProofUrl] = useState('');
  const [whatsappProofMethod, setWhatsappProofMethod] = useState<'upload' | 'url'>('upload');
  const [uploadingWhatsappImage, setUploadingWhatsappImage] = useState(false);
  const whatsappFileInputRef = useRef<HTMLInputElement>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Structured Quiz State
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(type === 'TASK');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const serverOffsetRef = useRef<number>(0);
  const [quizTimer, setQuizTimer] = useState<number>(0);
  const [quizDeadline, setQuizDeadline] = useState<Date | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizResults, setQuizResults] = useState<Record<string, boolean> | null>(null);
  const [quizPassed, setQuizPassed] = useState<boolean | null>(null);
  const [autosaving, setAutosaving] = useState(false);

  // Fetch full task data on open if it is a task
  useEffect(() => {
    if (type !== 'TASK' || !item?.id) return;
    let isMounted = true;

    async function fetchTaskDetails() {
      try {
        setTaskDetailLoading(true);
        const res = await fetch(`/api/tasks/${item.id}`);
        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.task) {
          setTaskDetail(data.task);

          // If quiz attempt exists:
          if (data.userSubmission) {
            const sub = data.userSubmission;
            if (sub.serverTime) {
              serverOffsetRef.current = new Date(sub.serverTime).getTime() - Date.now();
            }
            if (sub.savedAnswers) {
              answersRef.current = sub.savedAnswers;
              setQuizAnswers(sub.savedAnswers);
            }

            if (sub.status === 'IN_PROGRESS' && sub.deadline) {
              const deadlineDate = new Date(sub.deadline);
              setQuizDeadline(deadlineDate);
              setQuizStarted(true);
            } else if (sub.status === 'UNDER_REVIEW' || sub.status === 'REJECTED' || sub.status === 'APPROVED') {
              setQuizFinished(true);
              setQuizScore(sub.score ?? null);
              setQuizResults(sub.results ?? null);
              setQuizPassed(sub.passed ?? (sub.status === 'APPROVED' || sub.status === 'UNDER_REVIEW'));
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load task details:', err);
      } finally {
        if (isMounted) setTaskDetailLoading(false);
      }
    }

    fetchTaskDetails();
    return () => {
      isMounted = false;
    };
  }, [type, item?.id]);

  // Quiz Countdown Timer
  useEffect(() => {
    if (!quizDeadline || quizFinished) return;

    const interval = setInterval(() => {
      const now = Date.now() + serverOffsetRef.current;
      const diff = Math.max(0, Math.floor((quizDeadline.getTime() - now) / 1000));
      setQuizTimer(diff);

      if (diff <= 0) {
        clearInterval(interval);
        // Time expired! Auto-submit
        handleSubmitQuiz(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizDeadline, quizFinished]);

  // Handle WhatsApp Image Upload
  const handleWhatsappImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB size limit.');
      return;
    }

    setUploadingWhatsappImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar?type=proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload screenshot proof');

      setWhatsappProofUrl(data.profilePhoto);
      setSuccessMsg('Screenshot uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingWhatsappImage(false);
    }
  };

  // Standard Task Image Upload
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
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar?type=proof', {
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

  // Standard Task Submit
  const handleSubmitTask = async () => {
    if (!proofText.trim() && !proofUrl.trim()) {
      setError('Please provide proof of completion (written summary, screenshot, or URL).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let finalProofUrl = proofUrl.trim() || undefined;
      if (finalProofUrl && !finalProofUrl.startsWith('http') && !finalProofUrl.startsWith('data:image')) {
        finalProofUrl = `https://${finalProofUrl}`;
      }

      const res = await fetch(`/api/tasks/${item.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofText: proofText.trim() || undefined,
          proofUrl: finalProofUrl,
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

  // Start Quiz (Confirm Modal)
  const handleConfirmStartQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${item.id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start quiz');

      const duration = taskDetail?.durationSeconds || item.durationSeconds || 300;
      const deadline = new Date(Date.now() + duration * 1000);
      setQuizDeadline(deadline);
      setQuizTimer(duration);
      setQuizStarted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Select Option & Autosave
  const handleSelectQuizOption = async (questionId: string, option: string) => {
    if (quizFinished) return;
    const updated = { ...answersRef.current, [questionId]: option };
    answersRef.current = updated;
    setQuizAnswers(updated);

    setAutosaving(true);
    try {
      const res = await fetch(`/api/tasks/${item.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: updated }),
      });
      if (!res.ok) {
        const errData = await res.json();
        if (errData.error?.includes('expired')) {
          handleSubmitQuiz(true);
        }
      }
    } catch (e) {
      console.error('Autosave error:', e);
    } finally {
      setTimeout(() => setAutosaving(false), 300);
    }
  };

  // Submit Quiz for Grading
  const handleSubmitQuiz = async (isAutoExpired = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${item.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit quiz');

      setQuizFinished(true);
      setQuizScore(data.score ?? null);
      setQuizResults(data.results ?? null);
      setQuizPassed(data.passed ?? false);

      if (data.passed) {
        setSuccessMsg(data.message || 'Quiz passed! Your submission is now awaiting admin approval.');
      } else {
        setError(data.message || 'Quiz score was below 80%. Retries are not permitted.');
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(), 3000);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Submit
  const handleSubmitWhatsappProof = async () => {
    if (!whatsappProofUrl) {
      setError('Please provide proof of status update (upload screenshot or paste link).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let finalProofUrl = whatsappProofUrl.trim();
      if (!finalProofUrl.startsWith('http') && !finalProofUrl.startsWith('data:image')) {
        finalProofUrl = `https://${finalProofUrl}`;
      }

      const res = await fetch(`/api/whatsapp/${item.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: finalProofUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Proof submission failed');

      setSuccessMsg('WhatsApp campaign proof submitted! Reward will be credited upon approval.');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Ads logic
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

      setSuccessMsg('Reward claimed successfully! KES ' + item.reward?.toFixed(2) + ' added to your wallet.');
      setTimeout(() => {
        onSuccess();
      }, 1000);
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

  const isQuiz = taskDetail?.isQuiz || false;
  const quizQuestions = taskDetail?.formPayload?.questions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {type === 'TASK'
                ? isQuiz
                  ? 'Digital Skills Exam (MCQ)'
                  : item.category?.name || 'Task Assignment'
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

        {/* ══════════════════════════════════════════════════════════
            MODE A: WATCH ADS
        ══════════════════════════════════════════════════════════ */}
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

        {/* ══════════════════════════════════════════════════════════
            MODE B1: STRUCTURED QUIZ (Interactive Exam)
        ══════════════════════════════════════════════════════════ */}
        {type === 'TASK' && isQuiz && (
          <div className="space-y-6">
            {taskDetailLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
                <p className="text-xs">Loading exam parameters...</p>
              </div>
            ) : quizFinished ? (
              /* State 3: Quiz Finished / Graded */
              <div className="space-y-6 animate-in fade-in duration-300">
                <div
                  className={`p-6 rounded-3xl border text-center space-y-3 ${
                    quizPassed
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-black text-xl ${
                      quizPassed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {quizScore !== null ? `${quizScore}%` : quizPassed ? 'PASS' : 'FAIL'}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">
                      {quizPassed ? 'Congratulations! You Passed! 🎉' : 'Quiz Not Passed'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                      {quizPassed
                        ? `You achieved ${quizScore}%, exceeding the 80% passing mark. Your submission has entered the admin review queue. KES ${item.reward?.toFixed(2)} will be credited upon approval.`
                        : `You scored ${quizScore}%. The passing threshold is 80%. This quiz had one attempt and cannot be retaken.`}
                    </p>
                  </div>
                </div>

                {/* Per-Question Right/Wrong Breakdown (Zero Answer Key Leak) */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question Results Summary:
                  </h5>
                  <div className="space-y-2">
                    {quizQuestions.map((q: any, idx: number) => {
                      const isCorrect = quizResults ? quizResults[q.id] : null;
                      const userChoice = quizAnswers[q.id];

                      return (
                        <div
                          key={q.id || idx}
                          className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block">
                              Question #{idx + 1}: {q.prompt}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Your Selection: <strong className="text-slate-200">{userChoice || 'None'}</strong>
                            </span>
                          </div>
                          <div>
                            {isCorrect === true ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                              </span>
                            ) : isCorrect === false ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold flex items-center gap-1 text-[11px]">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close Exam Screen
                  </button>
                </div>
              </div>
            ) : !quizStarted ? (
              /* State 1: Pre-Start Confirmation Screen */
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                      <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white">Quiz Instructions & Rules</h4>
                      <p className="text-xs text-slate-400">Please review before launching the exam timer.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Questions</span>
                      <span className="text-base font-black text-white">{quizQuestions.length}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Time Limit</span>
                      <span className="text-base font-black text-amber-400">
                        {Math.ceil((taskDetail?.durationSeconds || item.durationSeconds || 300) / 60)} Mins
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Pass Mark</span>
                      <span className="text-base font-black text-emerald-400">80%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5 leading-relaxed">
                    <div className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-amber-400">
                      <Clock className="w-4 h-4" /> Exam Clock Policy
                    </div>
                    <p>• The exam clock is strictly unpausable and synchronized to the server.</p>
                    <p>• If you navigate away or close the page, the timer keeps running.</p>
                    <p>• You have exactly <strong>one attempt</strong>. Failed quizzes cannot be retaken.</p>
                    <p>• Answers autosave continuously as you select each option.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Passing Reward</span>
                    <span className="text-xl font-black text-brand-400">KES {item.reward?.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={loading}
                    onClick={handleConfirmStartQuiz}
                    className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Initiating Exam...' : 'I Am Ready — Start Quiz'}
                  </button>
                </div>
              </div>
            ) : (
              /* State 2: Active Exam in Progress */
              <div className="space-y-6">
                {/* Floating Timer & Autosave Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`w-4 h-4 ${quizTimer < 60 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`}
                    />
                    <span className="text-xs text-slate-400">Time Remaining:</span>
                    <span
                      className={`font-mono text-sm font-black ${
                        quizTimer < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                      }`}
                    >
                      {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    {autosaving ? (
                      <span className="text-amber-400 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Autosaving...
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Answers saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Cards */}
                <div className="space-y-6">
                  {quizQuestions.map((q: any, qIdx: number) => {
                    const selected = quizAnswers[q.id];

                    return (
                      <div
                        key={q.id || qIdx}
                        className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                            Question #{qIdx + 1}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {selected ? 'Answered' : 'Pending'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-relaxed">{q.prompt}</h4>

                        {/* Options A, B, C, D */}
                        <div className="space-y-2 pt-1">
                          {(q.options || []).map((opt: string, optIdx: number) => {
                            const isChosen = selected === opt;
                            const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectQuizOption(q.id, opt)}
                                className={`w-full p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                                  isChosen
                                    ? 'bg-brand-500/20 border-brand-500 text-brand-200 shadow-md shadow-brand-500/10'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isChosen
                                      ? 'bg-brand-500 text-slate-950'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {optionLetter}
                                </span>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Quiz Bar */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Target Reward</span>
                    <span className="text-lg font-black text-brand-400">KES {item.reward?.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={loading || quizTimer <= 0}
                    onClick={() => handleSubmitQuiz(false)}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-brand-500/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Submitting & Grading...' : 'Submit Quiz for Grading'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            MODE B2: STANDARD MICROTASK
        ══════════════════════════════════════════════════════════ */}
        {type === 'TASK' && !isQuiz && (
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
                <div className="flex flex-col gap-2">
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
                      <button
                        type="button"
                        onClick={() => setProofUrl('')}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  {proofUrl && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                      {proofUrl.startsWith('data:image') || proofUrl.match(/\.(jpg|jpeg|png|webp)($|\?)/i) ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <img src={proofUrl} alt="Attached Proof" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center text-brand-400">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Proof Attached
                        </p>
                        <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">{proofUrl}</p>
                      </div>
                    </div>
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

        {/* ══════════════════════════════════════════════════════════
            MODE C: WHATSAPP CAMPAIGN
        ══════════════════════════════════════════════════════════ */}
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

            {/* Proof Attachment Section (Upload or URL) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300">
                  Screenshot Proof of Status & Views *
                </label>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setWhatsappProofMethod('upload')}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      whatsappProofMethod === 'upload'
                        ? 'bg-brand-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappProofMethod('url')}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      whatsappProofMethod === 'url'
                        ? 'bg-brand-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Link / URL
                  </button>
                </div>
              </div>

              {whatsappProofMethod === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={whatsappFileInputRef}
                    accept="image/*"
                    onChange={handleWhatsappImageUpload}
                    className="hidden"
                  />

                  {whatsappProofUrl ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <img
                            src={whatsappProofUrl}
                            alt="Screenshot Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Screenshot Ready
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Ready to submit for verification</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => whatsappFileInputRef.current?.click()}
                          disabled={uploadingWhatsappImage}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setWhatsappProofUrl('')}
                          className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold"
                          title="Remove screenshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingWhatsappImage && whatsappFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-brand-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-brand-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        {uploadingWhatsappImage ? (
                          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {uploadingWhatsappImage ? 'Uploading Screenshot...' : 'Tap to select screenshot from gallery / camera'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supports JPG, PNG, WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://imgur.com/..."
                      value={whatsappProofUrl}
                      onChange={(e) => setWhatsappProofUrl(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                    />
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Paste a direct image or share link (Google Drive, Dropbox, Imgur, Postimages, iCloud).
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-gray-400">Campaign Reward</p>
                <p className="text-lg font-extrabold text-brand-400">KES {item.reward?.toFixed(2)}</p>
              </div>
              <button
                disabled={loading || uploadingWhatsappImage}
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
