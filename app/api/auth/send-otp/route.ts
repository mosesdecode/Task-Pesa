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

    const { type } = await request.json(); // EMAIL or PHONE

    if (type !== 'EMAIL' && type !== 'PHONE') {
      return NextResponse.json({ error: 'Invalid OTP type' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Invalidate existing active codes for this user and type
    await prisma.otpCode.updateMany({
      where: { userId, type, isUsed: false },
      data: { isUsed: true }
    });

    // Create new code
    await prisma.otpCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt
      }
    });

    // MOCK SENDING LOGIC (In production, integrate Resend/Nodemailer for Email, Africa's Talking for SMS)
    console.log(`[SECURITY] Simulated sending ${type} OTP to user ${userId}. Code: ${code}`);

    return NextResponse.json({ success: true, message: `OTP sent successfully to your ${type.toLowerCase()}` });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
