import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for larger video uploads

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No media file provided.' }, { status: 400 });
    }

    const mime = (file.type || '').toLowerCase();
    const isVideo = mime.startsWith('video/') || ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'].includes(mime);
    const isImage = mime.startsWith('image/') || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime);

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload an MP4, WebM, OGG, or QuickTime video, or a JPG, PNG, WEBP image.' },
        { status: 400 }
      );
    }

    // Size limit: 50MB for video, 10MB for image
    const MAX_SIZE = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File is too large. Maximum allowed size is ${isVideo ? '50MB for videos' : '10MB for images'}.` },
        { status: 400 }
      );
    }

    // Ensure upload directory exists in public/uploads/media
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename and create unique timestamped name
    const ext = path.extname(file.name) || (isVideo ? '.mp4' : '.jpg');
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${baseName.slice(0, 40)}${ext}`;
    const destinationPath = path.join(uploadDir, uniqueFilename);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(destinationPath, buffer);

    const mediaUrl = `/uploads/media/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      fileName: uniqueFilename,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      size: file.size,
      mimeType: mime,
    });
  } catch (error: any) {
    console.error('Media upload error:', error);
    if (error.message?.includes('Forbidden') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Failed to upload media file.' }, { status: 500 });
  }
}
