import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const links = await prisma.socialLink.findMany({
      where: { isActive: true },
    });

    return NextResponse.json({ links });
  } catch (error: any) {
    return NextResponse.json({ links: [] });
  }
}
