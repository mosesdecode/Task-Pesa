import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initializePaystackTransaction, generatePaystackReference, verifyPaystackTransaction } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { packageId, reference } = body;

    const pkg = await prisma.membershipPackage.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: 'Membership package not found' }, { status: 404 });
    }

    // ── Phase 2: Called after Paystack callback with a reference to verify ──
    if (reference) {
      // Verify the payment is genuinely successful
      const verification = await verifyPaystackTransaction(reference);
      if (!verification.success) {
        return NextResponse.json({ error: 'Payment not confirmed by Paystack' }, { status: 400 });
      }

      // Activate the package
      const expiresAt = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { packageId: pkg.id, packageExpiresAt: expiresAt },
      });

      // Upsert UserPackage — avoid duplicate if webhook already activated
      const existingPkg = await prisma.userPackage.findFirst({
        where: { userId: user.id, packageId: pkg.id, status: 'ACTIVE' },
        orderBy: { activatedAt: 'desc' },
      });

      if (!existingPkg) {
        await prisma.userPackage.create({
          data: {
            userId: user.id,
            packageId: pkg.id,
            expiresAt,
            status: 'ACTIVE',
            paymentReceipt: `PSK_${reference}`,
          },
        });
      }

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Upgraded to ${pkg.name}! 🌟`,
          message: `Your ${pkg.name} membership is now active for ${pkg.durationDays} days. Enjoy higher task limits and earning opportunities!`,
          type: 'SUCCESS',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Package ${pkg.name} activated successfully!`,
        package: pkg,
      });
    }

    // ── Phase 1: Initialize Paystack payment ──────────────────────────────
    const ref = generatePaystackReference('PKG');
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const callbackUrl = `${appUrl}/api/paystack/verify?reference=${ref}`;

    const paystackResult = await initializePaystackTransaction({
      email: user.email,
      amount: pkg.price,
      reference: ref,
      callbackUrl,
      userId: user.id,
      type: 'PACKAGE',
      phone: user.mpesaNumber,
      metadata: { packageId: pkg.id, packageName: pkg.name, username: user.username },
    });

    if (!paystackResult.success) {
      return NextResponse.json(
        { error: paystackResult.error || 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      reference: paystackResult.reference,
      depositId: paystackResult.depositId,
      package: pkg,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Package upgrade error' }, { status: 400 });
  }
}
