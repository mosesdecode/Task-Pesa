import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [tasks, ads, whatsappCampaigns, categories] = await Promise.all([
      prisma.task.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.advertisement.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.whatsappCampaign.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.taskCategory.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ tasks, ads, whatsappCampaigns, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { type, title, categorySlug, reward, instructions, proofRequired, durationSeconds, totalSlots, minPackageTier, mediaUrl, advertiser, campaignName, caption } = body;

    if (type === 'DATA_ANNOTATION' || type === 'MICROTASK' || !type) {
      const category = await prisma.taskCategory.findFirst({
        where: { slug: categorySlug || 'data-annotation' },
      }) || await prisma.taskCategory.findFirst();

      if (!category) {
        return NextResponse.json({ error: 'No task category found. Create a category first.' }, { status: 400 });
      }

      const task = await prisma.task.create({
        data: {
          title,
          instructions,
          proofRequired: proofRequired || 'Submit screenshot or completion proof',
          categoryId: category.id,
          reward: parseFloat(reward),
          durationSeconds: parseInt(durationSeconds) || 60,
          totalSlots: parseInt(totalSlots) || 100,
          remainingSlots: parseInt(totalSlots) || 100,
          minPackageTier: minPackageTier || 'BRONZE',
          status: 'ACTIVE',
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'CREATE_TASK',
          targetType: 'TASK',
          targetId: task.id,
          detailsJson: JSON.stringify({ title, reward, proofRequired }),
        },
      });

      return NextResponse.json({ success: true, task });
    }

    if (type === 'ADVERTISEMENT') {
      const ad = await prisma.advertisement.create({
        data: {
          title,
          advertiser: advertiser || 'Sponsor',
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800',
          durationSeconds: parseInt(durationSeconds) || 20,
          reward: parseFloat(reward),
          dailyLimit: 10,
          minPackageTier: minPackageTier || 'BRONZE',
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({ success: true, ad });
    }

    if (type === 'WHATSAPP') {
      const campaign = await prisma.whatsappCampaign.create({
        data: {
          campaignName: campaignName || title,
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
          caption: caption || '',
          instructions: instructions || 'Post on WhatsApp Status and submit screenshot proof.',
          reward: parseFloat(reward),
          maxParticipants: parseInt(totalSlots) || 50,
          minPackageTier: minPackageTier || 'BRONZE',
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({ success: true, campaign });
    }

    return NextResponse.json({ error: 'Invalid task creation type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { id, title, instructions, proofRequired, reward, status } = body;

    if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title || undefined,
        instructions: instructions || undefined,
        proofRequired: proofRequired || undefined,
        reward: reward ? parseFloat(reward) : undefined,
        status: status || undefined,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_TASK',
        targetType: 'TASK',
        targetId: task.id,
        detailsJson: JSON.stringify({ status, title }),
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const itemType = searchParams.get('type') || 'TASK';

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    if (itemType === 'TASK') {
      await prisma.task.delete({ where: { id } });
    } else if (itemType === 'AD') {
      await prisma.advertisement.delete({ where: { id } });
    } else if (itemType === 'WHATSAPP') {
      await prisma.whatsappCampaign.delete({ where: { id } });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_ITEM',
        targetType: itemType,
        targetId: id,
      },
    });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
