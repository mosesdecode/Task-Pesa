import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const adverts = await prisma.advertisement.findMany({
      include: {
        _count: {
          select: { views: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ adverts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      title,
      advertiser,
      mediaUrl,
      targetUrl,
      durationSeconds,
      reward,
      dailyLimit,
      description,
      status,
      startDate,
      endDate,
    } = body;

    if (!title || !mediaUrl) {
      return NextResponse.json(
        { error: 'Advert title and image/media URL are required.' },
        { status: 400 }
      );
    }

    const advert = await prisma.advertisement.create({
      data: {
        title: title.trim(),
        advertiser: advertiser?.trim() || 'Brand Sponsor',
        mediaUrl: mediaUrl.trim(),
        targetUrl: targetUrl?.trim() || null,
        description: description?.trim() || null,
        durationSeconds: parseInt(durationSeconds) || 30,
        reward: parseFloat(reward) || 5.0,
        dailyLimit: parseInt(dailyLimit) || 10,
        status: status || 'ACTIVE', // ACTIVE, PAUSED
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_ADVERT',
        targetType: 'ADVERTISEMENT',
        targetId: advert.id,
        detailsJson: JSON.stringify({ title: advert.title, reward: advert.reward }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Advert "${advert.title}" created successfully.`,
      advert,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create advert' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      id,
      title,
      advertiser,
      mediaUrl,
      targetUrl,
      durationSeconds,
      reward,
      dailyLimit,
      description,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Advert ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (advertiser !== undefined) updateData.advertiser = advertiser.trim();
    if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl.trim();
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl.trim() || null;
    if (description !== undefined) updateData.description = description.trim() || null;
    if (durationSeconds !== undefined) updateData.durationSeconds = parseInt(durationSeconds);
    if (reward !== undefined) updateData.reward = parseFloat(reward);
    if (dailyLimit !== undefined) updateData.dailyLimit = parseInt(dailyLimit);
    if (status !== undefined) updateData.status = status;

    const advert = await prisma.advertisement.update({
      where: { id },
      data: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_ADVERT',
        targetType: 'ADVERTISEMENT',
        targetId: advert.id,
        detailsJson: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Advert "${advert.title}" updated successfully.`,
      advert,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update advert' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Advert ID is required' }, { status: 400 });
    }

    await prisma.advertisement.delete({
      where: { id },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_ADVERT',
        targetType: 'ADVERTISEMENT',
        targetId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Advert deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete advert' }, { status: 400 });
  }
}
