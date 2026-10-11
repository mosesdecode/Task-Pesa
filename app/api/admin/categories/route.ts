import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
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

    // Enrich special categories with their respective model counts
    const enrichedCategories = categories.map((cat) => {
      if (cat.slug === 'watch-ads') {
        return {
          ...cat,
          _count: { tasks: activeAdsCount },
          isSpecialType: 'AD',
        };
      }
      if (cat.slug === 'whatsapp-promotions') {
        return {
          ...cat,
          _count: { tasks: activeWaCount },
          isSpecialType: 'WHATSAPP',
        };
      }
      return cat;
    });

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

    // Permanently remove if hard delete is requested or if category has 0 associated tasks
    if (hard || existing._count.tasks === 0) {
      if (existing._count.tasks > 0) {
        return NextResponse.json(
          { error: `Cannot permanently delete "${existing.name}" because it has ${existing._count.tasks} associated task(s). Reassign or delete tasks first.` },
          { status: 400 }
        );
      }

      await prisma.taskCategory.delete({
        where: { id },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'DELETE_CATEGORY',
          targetType: 'TASK_CATEGORY',
          targetId: id,
          detailsJson: JSON.stringify({ name: existing.name, slug: existing.slug }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Category "${existing.name}" has been permanently removed from the system.`,
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
