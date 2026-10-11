import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // Auto-sync & clean production database on admin fetch
    try {
      // 1. Remove unwanted categories (only if they have 0 tasks)
      await prisma.taskCategory.deleteMany({
        where: {
          OR: [
            { name: { in: ['Following Channels (Instagram, YouTube)', 'Referral Rewards', 'Watching Ads', 'WhatsApp Posting'] } },
            { slug: { in: ['following-channels', 'referral-rewards', 'watching-ads', 'whatsapp-posting'] } },
          ],
          tasks: { none: {} },
        },
      });

      // 2. Ensure "Sponsored Ads" exists in database
      const existingWatchAds = await prisma.taskCategory.findFirst({
        where: { OR: [{ slug: 'watch-ads' }, { name: 'Watch Ads' }, { name: 'Sponsored Ads' }] },
      });
      if (existingWatchAds) {
        if (existingWatchAds.name !== 'Sponsored Ads' || existingWatchAds.slug !== 'watch-ads') {
          await prisma.taskCategory.update({
            where: { id: existingWatchAds.id },
            data: {
              name: 'Sponsored Ads',
              slug: 'watch-ads',
              icon: 'PlaySquare',
              description: 'Watch brand sponsor video advertisements to earn instant rewards.',
              isActive: existingWatchAds.isActive,
            },
          });
        }
      } else {
        await prisma.taskCategory.create({
          data: {
            name: 'Sponsored Ads',
            slug: 'watch-ads',
            icon: 'PlaySquare',
            description: 'Watch brand sponsor video advertisements to earn instant rewards.',
            isActive: true,
          },
        });
      }

      // 3. Ensure "WhatsApp Promo" exists in database
      const existingWaPromo = await prisma.taskCategory.findFirst({
        where: { OR: [{ slug: 'whatsapp-promotions' }, { name: 'WhatsApp Promotions' }, { name: 'WhatsApp Promo' }] },
      });
      if (existingWaPromo) {
        if (existingWaPromo.name !== 'WhatsApp Promo' || existingWaPromo.slug !== 'whatsapp-promotions') {
          await prisma.taskCategory.update({
            where: { id: existingWaPromo.id },
            data: {
              name: 'WhatsApp Promo',
              slug: 'whatsapp-promotions',
              icon: 'Share2',
              description: 'Post campaign promotional material to status and submit screenshot proof.',
              isActive: existingWaPromo.isActive,
            },
          });
        }
      } else {
        await prisma.taskCategory.create({
          data: {
            name: 'WhatsApp Promo',
            slug: 'whatsapp-promotions',
            icon: 'Share2',
            description: 'Post campaign promotional material to status and submit screenshot proof.',
            isActive: true,
          },
        });
      }
    } catch (syncErr) {
      console.error('Category auto-sync error:', syncErr);
    }

    const [categories, activeAdsCount, activeWaCount] = await Promise.all([
      prisma.taskCategory.findMany({
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.advertisement.count({ where: { status: 'ACTIVE' } }),
      prisma.whatsappCampaign.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Filter out unwanted legacy categories from display
    const filteredCategories = categories.filter((cat) => {
      const isUnwantedName = ['Following Channels (Instagram, YouTube)', 'Referral Rewards', 'Watching Ads', 'WhatsApp Posting'].includes(cat.name);
      const isUnwantedSlug = ['following-channels', 'referral-rewards', 'watching-ads', 'whatsapp-posting'].includes(cat.slug);
      return !isUnwantedName && !isUnwantedSlug;
    });

    // Enrich special categories with their respective model counts
    let hasWatchAds = false;
    let hasWaPromo = false;

    const enrichedCategories = filteredCategories.map((cat) => {
      if (cat.slug === 'watch-ads' || cat.name === 'Sponsored Ads') {
        hasWatchAds = true;
        return {
          ...cat,
          name: 'Sponsored Ads',
          slug: 'watch-ads',
          _count: { tasks: activeAdsCount },
          isSpecialType: 'AD',
        };
      }
      if (cat.slug === 'whatsapp-promotions' || cat.name === 'WhatsApp Promo') {
        hasWaPromo = true;
        return {
          ...cat,
          name: 'WhatsApp Promo',
          slug: 'whatsapp-promotions',
          _count: { tasks: activeWaCount },
          isSpecialType: 'WHATSAPP',
        };
      }
      return cat;
    });

    // Fallback: If not yet in categories list, inject them directly
    if (!hasWatchAds) {
      enrichedCategories.push({
        id: 'watch-ads-system',
        name: 'Sponsored Ads',
        slug: 'watch-ads',
        icon: 'PlaySquare',
        description: 'Watch brand sponsor video advertisements to earn instant rewards.',
        isActive: true,
        _count: { tasks: activeAdsCount },
        isSpecialType: 'AD',
      } as any);
    }

    if (!hasWaPromo) {
      enrichedCategories.push({
        id: 'whatsapp-promo-system',
        name: 'WhatsApp Promo',
        slug: 'whatsapp-promotions',
        icon: 'Share2',
        description: 'Post campaign promotional material to status and submit screenshot proof.',
        isActive: true,
        _count: { tasks: activeWaCount },
        isSpecialType: 'WHATSAPP',
      } as any);
    }

    // Sort alphabetically by name
    enrichedCategories.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ categories: enrichedCategories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { name, slug, description, icon } = body;

    if (!name || !description) {
      return NextResponse.json({ error: 'Category name and description are required.' }, { status: 400 });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await prisma.taskCategory.findFirst({
      where: { OR: [{ slug: cleanSlug }, { name: name.trim() }] },
    });

    if (existing) {
      return NextResponse.json({ error: 'A category with this name or slug already exists.' }, { status: 400 });
    }

    const category = await prisma.taskCategory.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        description: description.trim(),
        icon: icon || 'CheckCircle',
        isActive: true,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_CATEGORY',
        targetType: 'TASK_CATEGORY',
        targetId: category.id,
        detailsJson: JSON.stringify({ name: category.name, slug: category.slug }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" created successfully.`,
      category,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { id, name, description, icon, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const category = await prisma.taskCategory.update({
      where: { id },
      data: updateData,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_CATEGORY',
        targetType: 'TASK_CATEGORY',
        targetId: category.id,
        detailsJson: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" updated successfully.`,
      category,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const existing = await prisma.taskCategory.findUnique({
      where: { id },
      include: { _count: { select: { tasks: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // System categories protection: prevent deletion of core platform features
    const isSystemCategory = ['whatsapp-promotions', 'watch-ads'].includes(existing.slug);
    if (isSystemCategory) {
      return NextResponse.json(
        { error: `"${existing.name}" is a core system category and cannot be permanently deleted. You can deactivate it by toggling its status instead.` },
        { status: 400 }
      );
    }

    // Permanently remove if hard delete is requested or if category has 0 associated tasks
    if (hard || existing._count.tasks === 0) {
      if (existing._count.tasks > 0 && !cascade) {
        return NextResponse.json(
          {
            error: `Cannot permanently delete "${existing.name}" because it has ${existing._count.tasks} associated task(s). Reassign them or confirm deletion with cascade.`,
            hasTasks: true,
            taskCount: existing._count.tasks,
          },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        if (existing._count.tasks > 0) {
          await tx.task.deleteMany({
            where: { categoryId: id },
          });
        }
        await tx.taskCategory.delete({
          where: { id },
        });
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'DELETE_CATEGORY',
          targetType: 'TASK_CATEGORY',
          targetId: id,
          detailsJson: JSON.stringify({
            name: existing.name,
            slug: existing.slug,
            deletedTasksCount: existing._count.tasks,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: existing._count.tasks > 0
          ? `Category "${existing.name}" and ${existing._count.tasks} associated task(s) permanently removed.`
          : `Category "${existing.name}" has been permanently removed from the system.`,
        deleted: true,
      });
    }

    // Otherwise soft-deactivate
    const category = await prisma.taskCategory.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'DEACTIVATE_CATEGORY',
        targetType: 'TASK_CATEGORY',
        targetId: category.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" has been deactivated.`,
      category,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process category deletion' }, { status: 400 });
  }
}
