import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/dashboard
 *
 * Single endpoint that replaces three parallel fetches on the tasks page:
 *   /api/tasks + /api/ads + /api/whatsapp → one round trip, one cold start.
 *
 * Returns: { tasks, categories, ads, campaigns }
 */
export async function GET(req: NextRequest) {
  try {
    // One auth check — reused across all three data fetches below
    const user = await getSessionUser(req);
    const now = new Date();

    // Fetch categories first (tiny, indexed table) to resolve slugs in-memory
    const categories = await prisma.taskCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, icon: true, description: true, isActive: true },
    });

    // Run all three heavy queries in parallel — no waterfall
    const [tasks, ads, campaigns] = await Promise.all([
      prisma.task.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  status: { in: ['PUBLISHED', 'ACTIVE'] },
                  category: { isActive: true },
                  OR: [{ endDate: null }, { endDate: { gt: now } }],
                  AND: [{ OR: [{ deadline: null }, { deadline: { gt: now } }] }],
                },
                ...(user ? [{ submissions: { some: { userId: user.id } } }] : []),
              ],
            },
          ],
        },
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
          // dataPayloadJson excluded — only needed when a task is opened individually
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
        take: 100,
      }),

      prisma.advertisement.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
        select: {
          id: true,
          title: true,
          description: true,
          advertiser: true,
          mediaUrl: true,
          targetUrl: true,
          durationSeconds: true,
          reward: true,
          dailyLimit: true,
          minPackageTier: true,
          status: true,
          createdAt: true,
          views: user
            ? { where: { userId: user.id }, select: { id: true, rewarded: true, viewedAt: true } }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      prisma.whatsappCampaign.findMany({
        where: user
          ? {
              OR: [
                {
                  status: 'ACTIVE',
                  OR: [{ deadline: null }, { deadline: { gt: now } }],
                },
                { submissions: { some: { userId: user.id } } },
              ],
            }
          : {
              status: 'ACTIVE',
              OR: [{ deadline: null }, { deadline: { gt: now } }],
            },
        select: {
          id: true,
          campaignName: true,
          mediaUrl: true,
          caption: true,
          instructions: true,
          reward: true,
          maxParticipants: true,
          minPackageTier: true,
          deadline: true,
          status: true,
          createdAt: true,
          submissions: user
            ? {
                where: { userId: user.id },
                orderBy: { submittedAt: 'desc' },
                take: 1,
                select: { id: true, status: true, proofUrl: true, adminNotes: true, submittedAt: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Map tasks to separate task definition from user submission status
    const mappedTasks = tasks.map((task: any) => {
      const userSub = task.submissions?.[0] || null;
      const userStatus = userSub ? userSub.status : 'NOT_STARTED';
      const { submissions, ...taskDetails } = task;
      return { ...taskDetails, userStatus, userSubmission: userSub || null };
    });

    return NextResponse.json({ tasks: mappedTasks, categories, ads, campaigns });
  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
