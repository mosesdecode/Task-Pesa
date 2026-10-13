import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getDefaultAvatarSvg(name?: string): string {
  const initial = (name || 'TM').substring(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" fill="#022c22" text-anchor="middle" dominant-baseline="middle">${initial}</text>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params?.id;
    if (!userId) {
      const defaultSvg = getDefaultAvatarSvg();
      return new NextResponse(defaultSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true, username: true, fullName: true },
    });

    if (!user || !user.profilePhoto) {
      const defaultSvg = getDefaultAvatarSvg(user?.username || user?.fullName);
      return new NextResponse(defaultSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // If already an external URL (e.g. CDN or S3), redirect
    if (user.profilePhoto.startsWith('http://') || user.profilePhoto.startsWith('https://')) {
      return NextResponse.redirect(user.profilePhoto);
    }

    // Parse Data URL (e.g. data:image/jpeg;base64,/9j/4AAQSkZJRg...)
    const match = user.profilePhoto.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    const mime = match ? match[1] : 'image/jpeg';
    const base64Data = match ? match[2] : user.profilePhoto;

    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error streaming user avatar:', error);
    const defaultSvg = getDefaultAvatarSvg();
    return new NextResponse(defaultSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
