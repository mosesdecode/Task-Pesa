import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { adminAdjustBalance } from '@/lib/wallet';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { fullName: { contains: query } },
              { username: { contains: query } },
              { email: { contains: query } },
              { phone: { contains: query } },
            ],
          }
        : undefined,
      include: {
        package: true,
        wallet: true,
        deviceLogs: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { userId, action, status, banReason, flagReason, balanceAdjustment, adjustmentReason } = body;

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    if (action === 'BAN') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: true,
          banReason: banReason || 'Violated terms of service / suspicious activity',
          status: 'SUSPENDED',
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'BAN_USER',
          targetType: 'USER',
          targetId: userId,
          detailsJson: JSON.stringify({ banReason }),
        },
      });

      return NextResponse.json({ success: true, message: 'User banned successfully', user: updatedUser });
    }

    if (action === 'UNBAN') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned: false,
          banReason: null,
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({ success: true, message: 'User unbanned successfully', user: updatedUser });
    }

    if (action === 'FLAG') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isFlagged: true,
          flagReason: flagReason || 'Flagged for manual review of suspicious activities',
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'FLAG_USER',
          targetType: 'USER',
          targetId: userId,
          detailsJson: JSON.stringify({ flagReason }),
        },
      });

      return NextResponse.json({ success: true, message: 'User flagged for suspicious activity', user: updatedUser });
    }

    if (action === 'UNFLAG') {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isFlagged: false,
          flagReason: null,
        },
      });

      return NextResponse.json({ success: true, message: 'User unflagged successfully', user: updatedUser });
    }

    if (action === 'TOGGLE_STATUS' && status) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'UPDATE_USER_STATUS',
          targetType: 'USER',
          targetId: userId,
          detailsJson: JSON.stringify({ status }),
        },
      });

      return NextResponse.json({ success: true, message: `User status updated to ${status}`, user: updatedUser });
    }

    if (action === 'ADJUST_BALANCE' && balanceAdjustment !== undefined) {
      const numAdjustment = parseFloat(balanceAdjustment);
      if (isNaN(numAdjustment) || numAdjustment === 0) {
        return NextResponse.json({ error: 'Please enter a non-zero adjustment amount' }, { status: 400 });
      }

      await adminAdjustBalance(
        admin.id,
        userId,
        numAdjustment,
        adjustmentReason || 'Administrative adjustment'
      );

      return NextResponse.json({
        success: true,
        message: `Successfully adjusted balance by KES ${numAdjustment.toFixed(2)}`,
      });
    }

    return NextResponse.json({ error: 'Invalid admin user action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
