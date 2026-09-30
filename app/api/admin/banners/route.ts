import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateBannerUrl, sanitizeText } from '@/lib/validate';

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
      where.placement = placement;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ banners });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      title,
      subtitle,
      body: bannerBody,
      imageUrl,
      imageAlt,
      ctaLabel,
      ctaUrl,
      linkUrl,
      placement,
      sortOrder,
      isActive,
      startsAt,
      endsAt,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (imageUrl) {
      const imgCheck = validateBannerUrl(imageUrl);
      if (!imgCheck.valid) return NextResponse.json({ error: imgCheck.error }, { status: 400 });
    }

    if (ctaUrl) {
      const ctaCheck = validateBannerUrl(ctaUrl);
      if (!ctaCheck.valid) return NextResponse.json({ error: ctaCheck.error }, { status: 400 });
    }

    if (linkUrl) {
      const linkCheck = validateBannerUrl(linkUrl);
      if (!linkCheck.valid) return NextResponse.json({ error: linkCheck.error }, { status: 400 });
    }

    const cleanTitle = sanitizeText(title, 200);
    const cleanSubtitle = subtitle ? sanitizeText(subtitle, 300) : null;
    const cleanBodyText = bannerBody ? sanitizeText(bannerBody, 1000) : null;
    const cleanImageUrl = imageUrl ? imageUrl.trim() : '';
    const cleanImageAlt = imageAlt ? sanitizeText(imageAlt, 150) : null;
    const cleanCtaLabel = ctaLabel ? sanitizeText(ctaLabel, 50) : null;
    const cleanCtaUrl = ctaUrl ? ctaUrl.trim() : null;
    const cleanLinkUrl = linkUrl ? linkUrl.trim() : null;
    const cleanPlacement = placement === 'home' ? 'home' : 'landing';
    const sortVal = typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0;

    const startDate = startsAt ? new Date(startsAt) : null;
    const endDate = endsAt ? new Date(endsAt) : null;

    const banner = await prisma.banner.create({
      data: {
        title: cleanTitle,
        subtitle: cleanSubtitle,
        body: cleanBodyText,
        imageUrl: cleanImageUrl,
        imageAlt: cleanImageAlt,
        ctaLabel: cleanCtaLabel,
        ctaUrl: cleanCtaUrl,
        linkUrl: cleanLinkUrl,
        placement: cleanPlacement,
        sortOrder: sortVal,
        isActive: isActive !== false,
        startsAt: startDate && !isNaN(startDate.getTime()) ? startDate : null,
        endsAt: endDate && !isNaN(endDate.getTime()) ? endDate : null,
        updatedById: admin.id,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_BANNER',
        targetType: 'Banner',
        targetId: banner.id,
        detailsJson: JSON.stringify(banner),
      },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      id,
      title,
      subtitle,
      body: bannerBody,
      imageUrl,
      imageAlt,
      ctaLabel,
      ctaUrl,
      linkUrl,
      placement,
      sortOrder,
      isActive,
      startsAt,
      endsAt,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 });
    }

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    if (imageUrl) {
      const imgCheck = validateBannerUrl(imageUrl);
      if (!imgCheck.valid) return NextResponse.json({ error: imgCheck.error }, { status: 400 });
    }
    if (ctaUrl) {
      const ctaCheck = validateBannerUrl(ctaUrl);
      if (!ctaCheck.valid) return NextResponse.json({ error: ctaCheck.error }, { status: 400 });
    }
    if (linkUrl) {
      const linkCheck = validateBannerUrl(linkUrl);
      if (!linkCheck.valid) return NextResponse.json({ error: linkCheck.error }, { status: 400 });
    }

    const cleanTitle = title ? sanitizeText(title, 200) : existing.title;
    const cleanSubtitle = subtitle !== undefined ? (subtitle ? sanitizeText(subtitle, 300) : null) : existing.subtitle;
    const cleanBodyText = bannerBody !== undefined ? (bannerBody ? sanitizeText(bannerBody, 1000) : null) : existing.body;
    const cleanImageUrl = imageUrl !== undefined ? (imageUrl ? imageUrl.trim() : '') : existing.imageUrl;
    const cleanImageAlt = imageAlt !== undefined ? (imageAlt ? sanitizeText(imageAlt, 150) : null) : existing.imageAlt;
    const cleanCtaLabel = ctaLabel !== undefined ? (ctaLabel ? sanitizeText(ctaLabel, 50) : null) : existing.ctaLabel;
    const cleanCtaUrl = ctaUrl !== undefined ? (ctaUrl ? ctaUrl.trim() : null) : existing.ctaUrl;
    const cleanLinkUrl = linkUrl !== undefined ? (linkUrl ? linkUrl.trim() : null) : existing.linkUrl;
    const cleanPlacement = placement !== undefined ? (placement === 'home' ? 'home' : 'landing') : existing.placement;
    const sortVal = sortOrder !== undefined ? (typeof sortOrder === 'number' ? sortOrder : parseInt(sortOrder) || 0) : existing.sortOrder;

    let startDate = existing.startsAt;
    if (startsAt !== undefined) {
      startDate = startsAt ? new Date(startsAt) : null;
    }
    let endDate = existing.endsAt;
    if (endsAt !== undefined) {
      endDate = endsAt ? new Date(endsAt) : null;
    }

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        title: cleanTitle,
        subtitle: cleanSubtitle,
        body: cleanBodyText,
        imageUrl: cleanImageUrl,
        imageAlt: cleanImageAlt,
        ctaLabel: cleanCtaLabel,
        ctaUrl: cleanCtaUrl,
        linkUrl: cleanLinkUrl,
        placement: cleanPlacement,
        sortOrder: sortVal,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        startsAt: startDate && !isNaN(startDate.getTime()) ? startDate : null,
        endsAt: endDate && !isNaN(endDate.getTime()) ? endDate : null,
        updatedById: admin.id,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_BANNER',
        targetType: 'Banner',
        targetId: updated.id,
        detailsJson: JSON.stringify({ before: existing, after: updated }),
      },
    });

    return NextResponse.json({ success: true, banner: updated });
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
        // no body
      }
    }

    if (!id) return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await prisma.banner.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_BANNER',
        targetType: 'Banner',
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
      const { items } = body; // Array of { id: string, sortOrder: number }
      if (!Array.isArray(items)) {
        return NextResponse.json({ error: 'Items array required' }, { status: 400 });
      }

      for (const item of items) {
        if (item.id && typeof item.sortOrder === 'number') {
          await prisma.banner.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder, updatedById: admin.id },
          });
        }
      }

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'REORDER_BANNERS',
          targetType: 'Banner',
          detailsJson: JSON.stringify(items),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'toggle') {
      const { id, isActive } = body;
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

      const updated = await prisma.banner.update({
        where: { id },
        data: { isActive: Boolean(isActive), updatedById: admin.id },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'TOGGLE_BANNER',
          targetType: 'Banner',
          targetId: id,
          detailsJson: JSON.stringify({ isActive: Boolean(isActive) }),
        },
      });

      return NextResponse.json({ success: true, banner: updated });
    }

    return NextResponse.json({ error: 'Invalid PATCH action' }, { status: 400 });
  } catch (error: any) {
    return handleError(error);
  }
}
