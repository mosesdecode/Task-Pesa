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

    const { firstName, surname, profilePhoto } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        surname,
        profilePhoto,
        fullName: firstName && surname ? `${firstName} ${surname}` : undefined,
      }
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
