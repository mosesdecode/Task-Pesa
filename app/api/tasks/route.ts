import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const searchQuery = searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '100', 10));

    const now = new Date();

    // Fetch categories first (cheap, small table) — resolves category slug
    // without a second waterfall query inside the tasks query
    const categories = await prisma.taskCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true, description: true, isActive: true },
    });

    // Resolve categoryId from slug in-memory — eliminates the DB waterfall
    let categoryIdFilter: string | undefined;
    if (categorySlug && categorySlug !== 'all') {
      const matched = categories.find((c) => c.slug === categorySlug);
      if (matched) categoryIdFilter = matched.id;
    }

    const whereConditions: any[] = [
      {
        OR: [
          {
            status: { in: ['PUBLISHED', 'ACTIVE'] },
            category: { isActive: true },
            // Exclude expired tasks
            OR: [
              { endDate: null },
              { endDate: { gt: now } },
            ],
            AND: [
              { OR: [{ deadline: null }, { deadline: { gt: now } }] },
            ],
          },
          // Always include tasks the user has already interacted with (for lifecycle tabs)
          ...(user ? [{ submissions: { some: { userId: user.id } } }] : []),
        ],
      },
    ];

    if (categoryIdFilter) {
      whereConditions.push({ categoryId: categoryIdFilter });
    }

    if (searchQuery && searchQuery.trim()) {
      whereConditions.push({
        OR: [
          { title: { contains: searchQuery.trim(), mode: 'insensitive' } },
          { instructions: { contains: searchQuery.trim(), mode: 'insensitive' } },
          { description: { contains: searchQuery.trim(), mode: 'insensitive' } },
        ],
      });
    }

    const whereClause: any = { AND: whereConditions };

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        rules: true,
        categoryId: true,
        reward: true,
        minPackageTier: true,
        durationSeconds: true,
        totalSlots: true,
        remainingSlots: true,
        deadline: true,
        endDate: true,
        status: true,
        proofRequired: true,
        externalUrl: true,
        // dataPayloadJson intentionally excluded from list — fetched only on task open
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        submissions: user
          ? {
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                rejectionReason: true,
                proofUrl: true,
                proofText: true,
                startedAt: true,
                submittedAt: true,
                reviewedAt: true,
              },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Map to clean shape separating task definition from user submission status
    const mappedTasks = tasks.map((task: any) => {
      const userSub = task.submissions?.[0] || null;
      const userStatus = userSub ? userSub.status : 'NOT_STARTED';
      const { submissions, ...taskDetails } = task;
      return {
        ...taskDetails,
        userStatus,
        userSubmission: userSub || null,
      };
    });

    return NextResponse.json({ tasks: mappedTasks, categories });
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
