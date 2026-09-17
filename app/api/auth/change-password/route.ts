import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Both current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password provided is incorrect.' },
        { status: 400 }
      );
    }

    // Hash and update to new password
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed successfully!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to change password.' },
      { status: 400 }
    );
  }
}
