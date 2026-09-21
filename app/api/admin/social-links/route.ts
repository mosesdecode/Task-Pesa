import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const links = await prisma.socialLink.findMany();
    return NextResponse.json({ links });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { platform, label, url, isActive } = body;

    if (!platform || !url) {
      return NextResponse.json({ error: 'Platform and URL are required' }, { status: 400 });
    }

    const link = await prisma.socialLink.upsert({
      where: { platform: platform.toLowerCase() },
      update: {
        label: label || platform,
        url,
        isActive: isActive !== false,
      },
      create: {
        platform: platform.toLowerCase(),
        label: label || platform,
        url,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, link });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Social Link ID required' }, { status: 400 });

    await prisma.socialLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
