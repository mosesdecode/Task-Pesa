import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        firstName: true,
        surname: true,
        fullName: true,
        profilePhoto: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: userProfile });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const { firstName, surname, profilePhoto } = body;

    const dataToUpdate: any = {};
    if (typeof firstName === 'string') dataToUpdate.firstName = firstName.trim();
    if (typeof surname === 'string') dataToUpdate.surname = surname.trim();
    if (typeof profilePhoto === 'string') dataToUpdate.profilePhoto = profilePhoto.trim();

    if (dataToUpdate.firstName || dataToUpdate.surname) {
      const fName = dataToUpdate.firstName || authUser.firstName || '';
      const sName = dataToUpdate.surname || authUser.surname || '';
      dataToUpdate.fullName = `${fName} ${sName}`.trim() || authUser.fullName;
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        firstName: true,
        surname: true,
        fullName: true,
        profilePhoto: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
