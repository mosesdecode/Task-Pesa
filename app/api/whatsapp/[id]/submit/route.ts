import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const campaignId = params.id;
    const body = await req.json();
    const { proofUrl } = body;

    if (!proofUrl) {
      return NextResponse.json({ error: 'Screenshot proof URL or image is required' }, { status: 400 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account activation required. Please pay KES 100 access fee to participate in WhatsApp status campaigns.' },
        { status: 403 }
      );
    }

    const campaign = await prisma.whatsappCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Tier rank check
    const TIER_RANKS: Record<string, number> = {
      BRONZE: 1,
      SILVER: 2,
      GOLD: 3,
      PLATINUM: 4,
    };

    const userTierRank = TIER_RANKS[user.package?.name || 'BRONZE'] || 1;
    const requiredTierRank = TIER_RANKS[campaign.minPackageTier || 'BRONZE'] || 1;

    if (userTierRank < requiredTierRank) {
      return NextResponse.json(
        { error: `This WhatsApp campaign requires a ${campaign.minPackageTier} package tier or higher. Please upgrade your membership tier.` },
        { status: 403 }
      );
    }

    // Check duplicate submission
    const existing = await prisma.whatsappSubmission.findFirst({
      where: { campaignId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted screenshot proof for this campaign.' }, { status: 400 });
    }

    const submission = await prisma.whatsappSubmission.create({
      data: {
        campaignId,
        userId: user.id,
        proofUrl,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'WhatsApp Proof Uploaded 📸',
        message: `Proof submitted for "${campaign.campaignName}". Admin review pending for KES ${campaign.reward.toFixed(2)} reward.`,
        type: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp Status screenshot proof submitted successfully and is pending admin verification.',
      submission,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Submission error' }, { status: 400 });
  }
}
