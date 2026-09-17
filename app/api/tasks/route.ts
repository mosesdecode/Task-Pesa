import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');

    let whereClause: any = { status: 'ACTIVE' };

    if (categorySlug && categorySlug !== 'all') {
      const category = await prisma.taskCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        whereClause.categoryId = category.id;
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        category: true,
        submissions: user ? { where: { userId: user.id } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
