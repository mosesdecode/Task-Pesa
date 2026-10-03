'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock } from 'lucide-react';

interface InactivityTimeoutProps {
  warningMinutes: number;
  timeoutMinutes: number;
  redirectUrl: string;
}

export default function InactivityTimeout({
  warningMinutes,
  timeoutMinutes,
  redirectUrl,
}: InactivityTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const timeoutMinutesMs = timeoutMinutes * 60 * 1000;
  const warningMinutesMs = warningMinutes * 60 * 1000;
  
  const lastActivityRef = useRef<number>(Date.now());
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors, force redirect anyway
    } finally {
      window.location.replace(redirectUrl);
    }
  }, [redirectUrl]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  useEffect(() => {
    // Check inactivity every 5 seconds
    warningIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const inactiveFor = now - lastActivityRef.current;

      if (inactiveFor >= timeoutMinutesMs) {
        // Timed out completely
        clearInterval(warningIntervalRef.current!);
        handleLogout();
      } else if (inactiveFor >= warningMinutesMs && !showWarning) {
        // Hit warning threshold
        setShowWarning(true);
        setCountdown(Math.ceil((timeoutMinutesMs - inactiveFor) / 1000));
      }
    }, 5000);

    return () => {
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current);
    };
  }, [timeoutMinutesMs, warningMinutesMs, showWarning, handleLogout]);

  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, handleLogout]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-brand-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto border-2 border-brand-500/20">
          <Clock className="w-8 h-8 text-brand-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Are you still there?</h2>
          <p className="text-sm text-slate-400 mt-2">
            You will be logged out in <strong className="text-brand-400">{countdown} seconds</strong> due to inactivity.
          </p>
        </div>
        <button
          onClick={resetTimer}
          className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-sm transition-all"
        >
          Keep me logged in
        </button>
      </div>
    </div>
  );
}
