import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sweepExpiredQuizAttempts } from '@/lib/quizSweep';

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
    // Run lazy finalization sweep in background — never block the dashboard response
    sweepExpiredQuizAttempts().catch((err) => console.error('Background sweep error:', err));

    // Get userId directly from JWT token — eliminates an extra round-trip DB query for user profile
    const token =
      req.cookies.get('taskmint_token')?.value ||
      req.cookies.get('taskpesa_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    const payload = token ? await verifyToken(token) : null;
    const userId = payload?.userId || null;
    const now = new Date();

    // Run ALL queries in parallel — single round trip
    const [categories, tasks, ads, campaigns] = await Promise.all([
      prisma.taskCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, icon: true, description: true, isActive: true },
      }),
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
                ...(userId ? [{ submissions: { some: { userId } } }] : []),
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
          createdAt: true,
          updatedAt: true,
          dataPayloadJson: true,
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          submissions: userId
            ? {
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  rejectionReason: true,
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
          views: userId
            ? { where: { userId }, select: { id: true, rewarded: true, viewedAt: true } }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.whatsappCampaign.findMany({
        where: userId
          ? {
              OR: [
                {
                  status: 'ACTIVE',
                  OR: [{ deadline: null }, { deadline: { gt: now } }],
                },
                { submissions: { some: { userId } } },
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
          submissions: userId
            ? {
                where: { userId },
                orderBy: { submittedAt: 'desc' },
                take: 1,
                select: { id: true, status: true, adminNotes: true, submittedAt: true },
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
      const { submissions, dataPayloadJson, ...taskDetails } = task;

      let isQuiz = false;
      let isMedia = false;
      let mediaType: 'VIDEO' | 'IMAGE' | null = null;
      if (dataPayloadJson) {
        try {
          const parsed = JSON.parse(dataPayloadJson);
          if (parsed.mode === 'QUIZ') isQuiz = true;
          if (parsed.mode === 'MEDIA') {
            isMedia = true;
            mediaType = parsed.mediaType || 'VIDEO';
          }
        } catch {}
      }

      return {
        ...taskDetails,
        isQuiz,
        isMedia,
        mediaType,
        userStatus,
        userSubmission: userSub || null,
      };
    });

    return NextResponse.json(
      { tasks: mappedTasks, categories, ads, campaigns },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
