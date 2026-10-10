import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pendingId = searchParams.get('pendingId');

    if (!pendingId) {
      return NextResponse.json({ error: 'pendingId is required' }, { status: 400 });
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });

    if (!pending) {
      // Check if user was already created (COMPLETED)
      return NextResponse.json({ status: 'NOT_FOUND' });
    }

    return NextResponse.json({ status: pending.status });
  } catch (error: any) {
    console.error('Register status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
