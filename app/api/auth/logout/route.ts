import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  };

  response.cookies.set('taskmint_token', '', cookieOptions);
  response.cookies.set('taskpesa_token', '', cookieOptions);
  response.cookies.delete('taskmint_token');
  response.cookies.delete('taskpesa_token');

  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');

  return response;
}
