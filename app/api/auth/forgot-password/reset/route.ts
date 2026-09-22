import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resetToken, newPassword } = body;

    if (!resetToken || typeof resetToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Locate the unused OTP record with this reset token
    const otpRecord = await prisma.otpCode.findUnique({
      where: { resetToken },
    });

    if (!otpRecord || otpRecord.isUsed || otpRecord.type !== 'PASSWORD_RESET') {
      return NextResponse.json(
        { error: 'Password reset session has expired or already been used. Please request a new code.' },
        { status: 400 }
      );
    }

    // Ensure within 15 minutes of creation
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (new Date(otpRecord.createdAt) < fifteenMinutesAgo) {
      return NextResponse.json(
        { error: 'Password reset session has timed out. Please request a new verification code.' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt (salt rounds = 10)
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and invalidate reset token in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: otpRecord.userId },
        data: { passwordHash },
      }),
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
          resetToken: null, // Wipe token to ensure zero reuse
        },
      }),
      prisma.notification.create({
        data: {
          userId: otpRecord.userId,
          title: 'Password Changed Successfully 🔒',
          message: 'Your TaskMint account password was successfully reset using your verified Safaricom phone number.',
          type: 'SUCCESS',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Password reset finalize error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
