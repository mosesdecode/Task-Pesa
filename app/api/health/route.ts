import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'MISSING',
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasPaystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
    hasPaystackPublic: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  };

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      userCount,
      environment: envCheck,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database: 'failed_to_connect',
      errorMessage: error.message,
      environment: envCheck,
    }, { status: 500 });
  }
}
