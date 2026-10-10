import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Please select an image file to upload' }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a JPG, PNG, or WEBP image.' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB for screenshots and avatars)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit. Please choose a smaller image.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isProof = searchParams.get('type') === 'proof';

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    if (isProof) {
      // Just return the base64 string for the frontend to submit with the task
      return NextResponse.json({
        success: true,
        message: 'Image processed successfully!',
        profilePhoto: dataUrl, // Re-using field name so frontend works without changes
      });
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: dataUrl },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        profilePhoto: true,
        phoneVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully!',
      profilePhoto: dataUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload profile photo' }, { status: 400 });
  }
}
