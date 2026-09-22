import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { validateReferralEligibility } from '@/lib/antifraud';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, username, email, phone, mpesaNumber, password, referralCode } = body;

    if (!fullName || !username || !email || !phone || !mpesaNumber || !password) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check duplicate phone/email/username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }, { username }, { mpesaNumber }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email, username, or phone number already exists.' },
        { status: 400 }
      );
    }

    // Handle Referral Code lookup with anti-fraud check
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });

      if (referrer) {
        const antiFraud = await validateReferralEligibility(referrer.id, {
          phone,
          mpesaNumber,
          email,
          username,
        });
        if (antiFraud.allowed) {
          referrerId = referrer.id;
        }
      }
    }

    const passwordHash = await hashPassword(password);
    // Generate clean TaskMint referral code
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const userReferralCode = `TM-${username.substring(0, 4).toUpperCase()}${randomSuffix}`;

    // Get default package
    const defaultPackage = await prisma.membershipPackage.findFirst({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    // Create user with PENDING_ACTIVATION status (Requirement 2)
    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        email,
        phone,
        mpesaNumber,
        passwordHash,
        referralCode: userReferralCode,
        referredById: referrerId,
        packageId: defaultPackage?.id,
        status: 'PENDING_ACTIVATION',
        isVerified: false,
        wallet: {
          create: {
            availableBalance: 0.0,
            pendingBalance: 0.0,
            totalEarned: 0.0,
            totalWithdrawn: 0.0,
          },
        },
      },
    });

    // Create pending Referral record if referred (Requirement 8 & 15)
    if (referrerId) {
      await prisma.referral.create({
        data: {
          referrerId,
          referredUserId: user.id,
          rewardAmount: 100.0, // KES 100 referral reward
          status: 'PENDING_ACTIVATION',
        },
      });
    }

    // Create welcoming notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to TaskMint! 👋',
        message: 'Your account has been created successfully. Explore available digital tasks, micro-jobs, and earn rewards.',
        type: 'INFO',
      },
    });

    // Generate session JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
      phone: user.phone,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        status: user.status,
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    };

    response.cookies.set('taskmint_token', token, cookieOptions);
    response.cookies.delete('taskpesa_token');

    return response;
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
