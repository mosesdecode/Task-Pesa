import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default_taskpesa_secret_key_change_in_production_2026'
);

export async function POST(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('taskpesa_token=') || c.trim().startsWith('taskmint_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, SECRET_KEY);
    const userId = (verified.payload as any).userId;

    const { type, code } = await request.json(); // EMAIL or PHONE

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        type,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true }
    });

    // Update user verification status
    const updateData = type === 'EMAIL' ? { emailVerified: true } : { phoneVerified: true };
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ success: true, message: `${type} verified successfully` });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
