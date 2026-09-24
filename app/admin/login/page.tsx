'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Lock, User, Eye, EyeOff, Zap, AlertCircle, Loader2 } from 'lucide-react';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON response body (e.g. server 500 HTML error)
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Login failed. Please try again.');
      }

      if (data.user?.role !== 'ADMIN') {
        // Non-admin account — purge the session cookie with a 10s timeout
        const logoutController = new AbortController();
        const logoutTimeoutId = setTimeout(() => logoutController.abort(), 10000);
        try {
          const logoutRes = await fetch('/api/auth/logout', {
            method: 'POST',
            signal: logoutController.signal,
          });
          clearTimeout(logoutTimeoutId);
          if (!logoutRes.ok) {
            throw new Error("Couldn't sign out non-admin session. Try again.");
          }
        } catch (e: any) {
          clearTimeout(logoutTimeoutId);
          if (e.name === 'AbortError') {
            throw new Error("Couldn't sign out non-admin session. Request timed out.");
          }
          throw new Error("Couldn't sign out non-admin session. Try again.");
        }
        throw new Error('Administrator access required');
      }

      // Validate redirect parameter: accept strictly '/admin' or '/admin/*' routes
      const rawRedirect = searchParams.get('redirect');
      const isValidRedirect =
        rawRedirect &&
        (rawRedirect === '/admin' || rawRedirect.startsWith('/admin/')) &&
        rawRedirect !== '/admin/login' &&
        !rawRedirect.startsWith('/admin/login/') &&
        !rawRedirect.startsWith('//') &&
        !rawRedirect.includes('\\') &&
        !rawRedirect.includes('://');

      const target = isValidRedirect ? rawRedirect : '/admin';
      window.location.replace(target);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Login request timed out. Check your connection and try again.');
      } else {
        setError(err.message || 'An error occurred during login.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-black/50 backdrop-blur-xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-brand-500 to-emerald-400 p-0.5 shadow-xl shadow-amber-500/10 mb-4">
          <div className="w-full h-full bg-dark-900 rounded-[14px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-amber-400 fill-amber-400/20" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
          <Zap className="w-3.5 h-3.5" />
          TaskMint KE — Admin Portal
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Authentication</h1>
        <p className="text-xs text-slate-400 mt-1">
          Sign in to access system control &amp; financial operations
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Email, Username, or Phone
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email, username, or phone"
              className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-brand-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              Authenticating...
            </>
          ) : (
            'Sign In to Admin Portal'
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-dark-900">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          Loading authentication...
        </div>
      }>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
