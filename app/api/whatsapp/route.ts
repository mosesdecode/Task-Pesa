import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const now = new Date();

    const campaigns = await prisma.whatsappCampaign.findMany({
      where: user
        ? {
            OR: [
              {
                status: 'ACTIVE',
                OR: [{ deadline: null }, { deadline: { gt: now } }],
              },
              { submissions: { some: { userId: user.id } } },
            ],
          }
        : {
            status: 'ACTIVE',
            OR: [{ deadline: null }, { deadline: { gt: now } }],
          },
      select: {
        id: true,
        campaignName: true,
        mediaUrl: true,
        caption: true,
        instructions: true,
        reward: true,
        maxParticipants: true,
        minPackageTier: true,
        deadline: true,
        status: true,
        createdAt: true,
        submissions: user
          ? {
              where: { userId: user.id },
              orderBy: { submittedAt: 'desc' },
              take: 1,
              select: { id: true, status: true, proofUrl: true, adminNotes: true, submittedAt: true },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch WhatsApp campaigns' }, { status: 500 });
  }
}
