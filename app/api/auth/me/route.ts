import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      const response = NextResponse.json({ user: null }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        mpesaNumber: user.mpesaNumber,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        firstName: user.firstName,
        surname: user.surname,
        profilePhoto: user.profilePhoto,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        country: user.country || 'KE',
        createdAt: user.createdAt,
        wallet: user.wallet,
      },
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  } catch (error) {
    const response = NextResponse.json({ user: null }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  }
}
