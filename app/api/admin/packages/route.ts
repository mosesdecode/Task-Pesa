import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const packages = await prisma.membershipPackage.findMany({
      orderBy: { price: 'asc' },
    });
    return NextResponse.json({ packages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { id, name, price, taskLimitDaily, watchAdsLimit, whatsappTasksLimit, referralBonus, durationDays, isActive } = body;

    const pkg = await prisma.membershipPackage.update({
      where: { id },
      data: {
        name,
        price: parseFloat(price),
        taskLimitDaily: parseInt(taskLimitDaily),
        watchAdsLimit: parseInt(watchAdsLimit),
        whatsappTasksLimit: parseInt(whatsappTasksLimit),
        referralBonus: parseFloat(referralBonus),
        durationDays: parseInt(durationDays),
        isActive: Boolean(isActive),
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_PACKAGE_CONFIG',
        targetType: 'MEMBERSHIP_PACKAGE',
        targetId: pkg.id,
        detailsJson: JSON.stringify({ name, price, taskLimitDaily, referralBonus }),
      },
    });

    return NextResponse.json({ success: true, message: `Package ${pkg.name} configuration updated!`, package: pkg });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
