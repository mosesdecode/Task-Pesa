import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement') || 'landing';
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        placement,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        body: true,
        imageUrl: true,
        imageAlt: true,
        ctaLabel: true,
        ctaUrl: true,
        linkUrl: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ banners });
  } catch (error: any) {
    return NextResponse.json({ banners: [] });
  }
}
