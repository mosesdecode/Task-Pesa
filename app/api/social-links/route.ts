import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement');

    const where: any = { isActive: true };
    if (placement) {
      where.placement = { has: placement };
    }

    const links = await prisma.socialLink.findMany({
      where,
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        platform: true,
        label: true,
        url: true,
        icon_key: true,
        placement: true,
      },
    });

    return NextResponse.json({ links });
  } catch (error: any) {
    return NextResponse.json({ links: [] });
  }
}
