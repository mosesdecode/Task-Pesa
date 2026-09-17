import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const packages = await prisma.membershipPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const parsedPackages = packages.map((pkg) => ({
      ...pkg,
      features: JSON.parse(pkg.featuresJson || '[]'),
    }));

    return NextResponse.json({ packages: parsedPackages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}
