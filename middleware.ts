import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default_taskmint_secret_key_change_in_production_2026'
);

export async function middleware(request: NextRequest) {
  // Geo-IP Blocking (Kenya Only)
  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry');
  
  // If the header exists and it's not Kenya, block access
  if (country && country !== 'KE' && !request.nextUrl.pathname.startsWith('/access-denied')) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  const token = request.cookies.get('taskmint_token')?.value || request.cookies.get('taskpesa_token')?.value;

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password');
  
  // Public admin login page handling
  if (pathname === '/admin/login') {
    if (token) {
      try {
        const verified = await jwtVerify(token, SECRET_KEY);
        const payload = verified.payload as any;
        if (payload.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // Invalid/expired token: treat as logged out, allow rendering login page
      }
    }
    return NextResponse.next();
  }

  // Admin area protection - only ADMIN role permitted
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const verified = await jwtVerify(token, SECRET_KEY);
      const payload = verified.payload as any;
      if (payload.role !== 'ADMIN') {
        // Ordinary users cannot access the admin panel
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    } catch (error) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('taskmint_token');
      response.cookies.delete('taskpesa_token');
      return response;
    }
  }

  // Protected user areas that require valid authentication
  const isProtectedPath = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/packages') ||
    pathname.startsWith('/referrals') ||
    pathname.startsWith('/support');

  if (isProtectedPath) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      const response = NextResponse.next();
      // Enforce strict no-cache on private user data
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    } catch (error) {
      // Token is invalid or expired
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('taskmint_token');
      response.cookies.delete('taskpesa_token');
      return response;
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && token) {
    try {
      const verified = await jwtVerify(token, SECRET_KEY);
      const payload = verified.payload as any;
      if (payload.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Invalid token, allow access to login/register
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - uploads (uploaded media/avatars)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|uploads|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
