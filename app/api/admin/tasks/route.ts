import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [rawTasks, categories] = await Promise.all([
      prisma.task.findMany({
        include: {
          category: true,
          submissions: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.taskCategory.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    // Calculate management statistics for each task
    const tasksWithStats = rawTasks.map((t) => {
      const allSubs = t.submissions || [];
      const started = allSubs.length;
      const submitted = allSubs.filter((s) => s.status !== 'IN_PROGRESS').length;
      const pendingReview = allSubs.filter((s) => s.status === 'UNDER_REVIEW' || s.status === 'SUBMITTED').length;
      const approved = allSubs.filter((s) => s.status === 'APPROVED').length;
      const rejected = allSubs.filter((s) => s.status === 'REJECTED').length;

      const { submissions, ...taskData } = t;
      return {
        ...taskData,
        stats: {
          totalSlots: t.totalSlots,
          remainingSlots: t.remainingSlots,
          started,
          submitted,
          pendingReview,
          approved,
          rejected,
        },
      };
    });

    return NextResponse.json({
      tasks: tasksWithStats,
      categories,
    });
  } catch (error: any) {
    console.error('Admin tasks fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin tasks' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      title,
      description,
      categoryId,
      categorySlug,
      reward,
      instructions,
      rules,
      proofRequired,
      durationSeconds,
      totalSlots,
      status,
      externalUrl,
      startDate,
      endDate,
    } = body;

    if (!title || !instructions) {
      return NextResponse.json(
        { error: 'Please provide task title and detailed instructions.' },
        { status: 400 }
      );
    }

    let targetCategory = null;
    if (categoryId) {
      targetCategory = await prisma.taskCategory.findUnique({ where: { id: categoryId } });
    } else if (categorySlug) {
      targetCategory = await prisma.taskCategory.findFirst({ where: { slug: categorySlug } });
    }

    if (!targetCategory) {
      targetCategory = await prisma.taskCategory.findFirst();
    }

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'No task category found. Please create a category first.' },
        { status: 400 }
      );
    }

    const slotsNum = parseInt(totalSlots) || 100;
    const rewardNum = parseFloat(reward) || 50;

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        instructions: instructions.trim(),
        rules: rules?.trim() || null,
        categoryId: targetCategory.id,
        reward: rewardNum,
        totalSlots: slotsNum,
        remainingSlots: slotsNum,
        durationSeconds: parseInt(durationSeconds) || 120,
        status: status || 'PUBLISHED', // DRAFT, PUBLISHED, PAUSED, CLOSED
        proofRequired: proofRequired?.trim() || 'Submit text, link, or screenshot proof',
        externalUrl: externalUrl?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { category: true },
    });

    // Record Audit Log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_TASK',
        targetType: 'TASK',
        targetId: task.id,
        detailsJson: JSON.stringify({
          title: task.title,
          reward: task.reward,
          slots: task.totalSlots,
          status: task.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Task "${task.title}" created successfully!`,
      task,
    });
  } catch (error: any) {
    console.error('Admin create task error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const {
      id,
      title,
      description,
      categoryId,
      reward,
      instructions,
      rules,
      proofRequired,
      durationSeconds,
      totalSlots,
      remainingSlots,
      status,
      externalUrl,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim() || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (reward !== undefined) updateData.reward = parseFloat(reward);
    if (instructions !== undefined) updateData.instructions = instructions.trim();
    if (rules !== undefined) updateData.rules = rules.trim() || null;
    if (proofRequired !== undefined) updateData.proofRequired = proofRequired.trim();
    if (durationSeconds !== undefined) updateData.durationSeconds = parseInt(durationSeconds);
    if (totalSlots !== undefined) updateData.totalSlots = parseInt(totalSlots);
    if (remainingSlots !== undefined) updateData.remainingSlots = parseInt(remainingSlots);
    if (status !== undefined) updateData.status = status; // DRAFT, PUBLISHED, PAUSED, CLOSED
    if (externalUrl !== undefined) updateData.externalUrl = externalUrl.trim() || null;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    // Record Audit Log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_TASK',
        targetType: 'TASK',
        targetId: task.id,
        detailsJson: JSON.stringify({
          updatedFields: Object.keys(updateData),
          status: task.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Task updated successfully! Status is now ${task.status}.`,
      task,
    });
  } catch (error: any) {
    console.error('Admin update task error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Check if task has approved submissions (if so, close it instead of deleting to preserve user transaction history)
    const approvedCount = await prisma.taskSubmission.count({
      where: { taskId: id, status: 'APPROVED' },
    });

    if (approvedCount > 0) {
      const closedTask = await prisma.task.update({
        where: { id },
        data: { status: 'CLOSED' },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: 'CLOSE_TASK',
          targetType: 'TASK',
          targetId: id,
          detailsJson: JSON.stringify({ reason: 'Closed because approved submissions exist' }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Task has approved submissions in user wallets. Task was safely set to CLOSED instead of deleted.',
        task: closedTask,
      });
    }

    // If no approved submissions, delete safely
    await prisma.task.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_TASK',
        targetType: 'TASK',
        targetId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error: any) {
    console.error('Admin delete task error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 400 });
  }
}
