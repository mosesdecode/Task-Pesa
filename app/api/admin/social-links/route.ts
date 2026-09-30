import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateSocialUrl, sanitizeText } from '@/lib/validate';

function handleError(error: any) {
  const message = error.message || 'An error occurred';
  if (message.includes('Unauthorized')) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  if (message.includes('Forbidden')) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement');

    const where: any = {};
    if (placement) {
      where.placement = { has: placement };
    }

    const links = await prisma.socialLink.findMany({
      where,
      orderBy: { sort_order: 'asc' },
    });

    return NextResponse.json({ links });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { platform, label, url, icon_key, placement, isActive, sort_order } = body;

    if (!platform || !url) {
      return NextResponse.json({ error: 'Platform and URL are required' }, { status: 400 });
    }

    const urlCheck = validateSocialUrl(platform, url);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error }, { status: 400 });
    }

    const cleanPlatform = sanitizeText(platform, 50).toLowerCase();
    const cleanLabel = sanitizeText(label || platform, 100);
    const cleanUrl = url.trim();
    const cleanIconKey = icon_key ? sanitizeText(icon_key, 50) : null;
    const cleanPlacement = Array.isArray(placement) && placement.length > 0
      ? placement.map(p => sanitizeText(p, 50))
      : ['community_row'];
    const sortVal = typeof sort_order === 'number' ? sort_order : parseInt(sort_order) || 0;

    const link = await prisma.socialLink.create({
      data: {
        platform: cleanPlatform,
        label: cleanLabel,
        url: cleanUrl,
        icon_key: cleanIconKey,
        placement: cleanPlacement,
        isActive: isActive !== false,
        sort_order: sortVal,
        updatedById: admin.id,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_SOCIAL_LINK',
        targetType: 'SocialLink',
        targetId: link.id,
        detailsJson: JSON.stringify(link),
      },
    });

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { id, platform, label, url, icon_key, placement, isActive, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Social Link ID is required' }, { status: 400 });
    }

    const existing = await prisma.socialLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Social Link not found' }, { status: 404 });
    }

    if (url) {
      const urlCheck = validateSocialUrl(platform || existing.platform, url);
      if (!urlCheck.valid) {
        return NextResponse.json({ error: urlCheck.error }, { status: 400 });
      }
    }

    const cleanPlatform = platform ? sanitizeText(platform, 50).toLowerCase() : existing.platform;
    const cleanLabel = label ? sanitizeText(label, 100) : existing.label;
    const cleanUrl = url ? url.trim() : existing.url;
    const cleanIconKey = icon_key !== undefined ? (icon_key ? sanitizeText(icon_key, 50) : null) : existing.icon_key;
    const cleanPlacement = Array.isArray(placement) && placement.length > 0
      ? placement.map(p => sanitizeText(p, 50))
      : existing.placement;
    const sortVal = sort_order !== undefined ? (typeof sort_order === 'number' ? sort_order : parseInt(sort_order) || 0) : existing.sort_order;

    const updated = await prisma.socialLink.update({
      where: { id },
      data: {
        platform: cleanPlatform,
        label: cleanLabel,
        url: cleanUrl,
        icon_key: cleanIconKey,
        placement: cleanPlacement,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        sort_order: sortVal,
        updatedById: admin.id,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_SOCIAL_LINK',
        targetType: 'SocialLink',
        targetId: updated.id,
        detailsJson: JSON.stringify({ before: existing, after: updated }),
      },
    });

    return NextResponse.json({ success: true, link: updated });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {
        // body not present
      }
    }

    if (!id) return NextResponse.json({ error: 'Social Link ID required' }, { status: 400 });

    const existing = await prisma.socialLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Social Link not found' }, { status: 404 });
    }

    await prisma.socialLink.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_SOCIAL_LINK',
        targetType: 'SocialLink',
        targetId: id,
        detailsJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    if (action === 'reorder') {
      const { items } = body; // Array of { id: string, sort_order: number }
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'Items array required' }, { status: 400 });
      }

      for (const item of items) {
        if (item.id && typeof item.sort_order === 'number') {
          await prisma.socialLink.update({
            where: { id: item.id },
            data: { sort_order: item.sort_order, updatedById: admin.id },
          });
        }
      }

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'REORDER_SOCIAL_LINKS',
          targetType: 'SocialLink',
          detailsJson: JSON.stringify(items),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'toggle') {
      const { id, isActive } = body;
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      const updated = await prisma.socialLink.update({
        where: { id },
        data: { isActive: Boolean(isActive), updatedById: admin.id },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'TOGGLE_SOCIAL_LINK',
          targetType: 'SocialLink',
          targetId: id,
          detailsJson: JSON.stringify({ isActive: Boolean(isActive) }),
        },
      });

      return NextResponse.json({ success: true, link: updated });
    }

    return NextResponse.json({ error: 'Invalid PATCH action' }, { status: 400 });
  } catch (error: any) {
    return handleError(error);
  }
}
