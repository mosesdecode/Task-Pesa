'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/tasks',
  '/wallet',
  '/referrals',
  '/profile',
  '/notifications',
  '/packages',
  '/activate',
  '/admin',
  '/support',
];

export default function TabSessionGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Explicitly exclude all auth pages to prevent any infinite redirect loops
    if (
      pathname === '/admin/login' ||
      pathname.startsWith('/admin/login/') ||
      pathname === '/login' ||
      pathname.startsWith('/login/') ||
      pathname === '/register' ||
      pathname.startsWith('/register/') ||
      pathname === '/forgot-password' ||
      pathname.startsWith('/forgot-password/')
    ) {
      return;
    }

    // If the path is protected, check if this tab has an active session
    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

    if (!isProtected) return;

    // sessionStorage is automatically wiped when a tab is closed.
    // If the marker is missing, the tab was closed and reopened (e.g. from history or bookmark).
    const marker = sessionStorage.getItem('taskmint_tab_active');
    if (!marker) {
      const redirectTarget = pathname.startsWith('/admin') ? '/admin/login' : '/login';
      try {
        // keepalive ensures the logout happens even as the browser navigates away instantly
        fetch('/api/auth/logout', { method: 'POST', keepalive: true });
      } catch (e) {
        // Ignore network failure, redirect immediately
      }
      window.location.replace(redirectTarget);
    }
  }, [pathname]); // Run on mount and when navigating client-side

  return null;
}
