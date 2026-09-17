import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const campaigns = await prisma.whatsappCampaign.findMany({
      where: { status: 'ACTIVE' },
      include: {
        submissions: user ? { where: { userId: user.id } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch WhatsApp campaigns' }, { status: 500 });
  }
}
