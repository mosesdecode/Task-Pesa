import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const ads = await prisma.advertisement.findMany({
      where: { status: 'ACTIVE' },
      include: {
        views: user ? { where: { userId: user.id } } : false,
      },
    });

    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
  }
}
