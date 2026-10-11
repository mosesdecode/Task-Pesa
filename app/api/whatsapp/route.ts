import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const campaigns = await prisma.whatsappCampaign.findMany({
      where: user
        ? {
            OR: [
              { status: 'ACTIVE' },
              { submissions: { some: { userId: user.id } } },
            ],
          }
        : { status: 'ACTIVE' },
      include: {
        submissions: user ? { where: { userId: user.id }, orderBy: { submittedAt: 'desc' } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch WhatsApp campaigns' }, { status: 500 });
  }
}
