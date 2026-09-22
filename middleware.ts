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

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  
  // Note: /admin handles its own secure gate: unauthenticated visitors see ONLY the admin login page
  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/tasks') ||
    request.nextUrl.pathname.startsWith('/wallet') ||
    request.nextUrl.pathname.startsWith('/referrals') ||
    request.nextUrl.pathname.startsWith('/support') ||
    request.nextUrl.pathname.startsWith('/activate');

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      await jwtVerify(token, SECRET_KEY);
    } catch (error) {
      // Token is invalid or expired
      const response = NextResponse.redirect(new URL('/login', request.url));
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
      // Invalid token, do nothing, let them access login/register
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
