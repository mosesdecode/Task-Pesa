import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const searchQuery = searchParams.get('q');

    const whereClause: any = {
      status: { in: ['PUBLISHED', 'ACTIVE'] },
      category: { isActive: true },
    };

    if (categorySlug && categorySlug !== 'all') {
      const category = await prisma.taskCategory.findFirst({
        where: { slug: categorySlug, isActive: true },
      });
      if (category) {
        whereClause.categoryId = category.id;
      }
    }

    if (searchQuery && searchQuery.trim()) {
      whereClause.OR = [
        { title: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { instructions: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { description: { contains: searchQuery.trim(), mode: 'insensitive' } },
      ];
    }

    const [tasks, categories] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          category: true,
          submissions: user
            ? {
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 1,
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.taskCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Map each task to cleanly separate task definition from user submission status
    const mappedTasks = tasks.map((task: any) => {
      const userSub = task.submissions?.[0] || null;
      let userStatus = 'NOT_STARTED';
      if (userSub) {
        userStatus = userSub.status; // IN_PROGRESS, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
      }

      const { submissions, ...taskDetails } = task;
      return {
        ...taskDetails,
        userStatus,
        userSubmission: userSub
          ? {
              id: userSub.id,
              status: userSub.status,
              rejectionReason: userSub.rejectionReason,
              proofUrl: userSub.proofUrl,
              proofText: userSub.proofText,
              startedAt: userSub.startedAt,
              submittedAt: userSub.submittedAt,
              reviewedAt: userSub.reviewedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      tasks: mappedTasks,
      categories,
    });
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
