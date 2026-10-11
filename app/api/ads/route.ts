import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const now = new Date();

    const ads = await prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gt: now } }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        advertiser: true,
        mediaUrl: true,
        targetUrl: true,
        durationSeconds: true,
        reward: true,
        dailyLimit: true,
        minPackageTier: true,
        status: true,
        createdAt: true,
        views: user ? { where: { userId: user.id }, select: { id: true, rewarded: true, viewedAt: true } } : false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
  }
}
