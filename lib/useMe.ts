'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  mpesaNumber?: string;
  role: 'USER' | 'ADMIN';
  status: string;
  referralCode?: string;
  firstName?: string;
  surname?: string;
  profilePhoto?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  country?: string;
  createdAt?: string;
  wallet?: any;
}

// In-memory single-flight & short-lived deduplication cache
let cachedUser: AuthUser | null = null;
let cacheTimestamp = 0;
let inflightPromise: Promise<AuthUser | null> | null = null;
const CACHE_TTL_MS = 30000; // 30 seconds

const listeners = new Set<(user: AuthUser | null) => void>();

function notifyListeners(user: AuthUser | null) {
  listeners.forEach((fn) => fn(user));
}

/**
 * Fetch current user session with in-flight request deduplication and 30s cache.
 * Multiple simultaneous calls on the same page will merge into a single HTTP request.
 */
export async function getMe(force = false): Promise<AuthUser | null> {
  const now = Date.now();

  if (!force && cachedUser && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedUser;
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        cachedUser = data.user || null;
        cacheTimestamp = Date.now();
      } else {
        cachedUser = null;
      }
    } catch (e) {
      cachedUser = null;
    } finally {
      inflightPromise = null;
      notifyListeners(cachedUser);
    }
    return cachedUser;
  })();

  return inflightPromise;
}

/**
 * Mutate local user state immediately across all components (e.g. after profile save or avatar upload).
 */
export function mutateMe(updatedUser: AuthUser | null) {
  cachedUser = updatedUser;
  cacheTimestamp = Date.now();
  notifyListeners(cachedUser);
}

/**
 * Invalidate session cache (e.g. on logout).
 */
export function invalidateMe() {
  cachedUser = null;
  cacheTimestamp = 0;
  notifyListeners(null);
}

/**
 * Shared React hook for user session across Navbar, MobileNav, and Page components.
 */
export function useMe() {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(!cachedUser);

  useEffect(() => {
    let mounted = true;

    const onUpdate = (u: AuthUser | null) => {
      if (mounted) {
        setUser(u);
        setLoading(false);
      }
    };

    listeners.add(onUpdate);

    // If cache is fresh, set immediately
    if (cachedUser && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      setUser(cachedUser);
      setLoading(false);
    } else {
      getMe().then((u) => {
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      listeners.delete(onUpdate);
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const u = await getMe(true);
    setUser(u);
    setLoading(false);
    return u;
  }, []);

  return { user, loading, refresh, mutate: mutateMe };
}
