'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email, phone, or password');
      }

      if (data.user?.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = redirectPath;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-700/80 shadow-2xl">
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-brand-500/20">
            TM
          </div>
        </Link>
        <h1 className="text-2xl font-black text-white">Welcome Back to TaskMint</h1>
        <p className="text-xs text-gray-400">Log in to manage tasks, track earnings, and request withdrawals</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-300">Email, Phone, or Username</label>
          <input
            type="text"
            required
            placeholder="e.g. 0712345678 or john@example.co.ke"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300">Password</label>
            <Link href="/forgot-password" className="text-[11px] text-brand-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In to TaskMint</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-400 font-bold hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md p-10 text-center text-slate-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
