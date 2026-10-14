import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const taskId = params.id;
    const body = await req.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers payload must be an object' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { durationSeconds: true, dataPayloadJson: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const sub = await prisma.taskSubmission.findFirst({
      where: { taskId, userId: user.id },
    });

    if (!sub || sub.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'No active in-progress quiz session found for autosave.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const duration = task.durationSeconds || 300;
    const deadline = new Date(sub.startedAt.getTime() + duration * 1000 + 15000); // 15s network grace

    if (now > deadline) {
      return NextResponse.json(
        { error: 'Exam timer has expired. Cannot autosave past the deadline.' },
        { status: 400 }
      );
    }

    // Validate questions and choices if payload exists
    const sanitizedAnswers: Record<string, string> = {};
    if (task.dataPayloadJson) {
      try {
        const payload = JSON.parse(task.dataPayloadJson);
        const validQuestions = payload.questions || [];

        validQuestions.forEach((q: any) => {
          if (answers[q.id] !== undefined) {
            const chosenOption = String(answers[q.id]).trim();
            // Validate that chosen option belongs to the allowed options
            if (!q.options || q.options.some((opt: string) => opt.trim() === chosenOption)) {
              sanitizedAnswers[q.id] = chosenOption;
            }
          }
        });
      } catch (e) {
        // Fallback: copy keys as string
        Object.keys(answers).forEach((k) => {
          sanitizedAnswers[k] = String(answers[k]);
        });
      }
    } else {
      Object.keys(answers).forEach((k) => {
        sanitizedAnswers[k] = String(answers[k]);
      });
    }

    let existingData: any = {};
    try {
      if (sub.submissionDataJson) {
        existingData = JSON.parse(sub.submissionDataJson);
      }
    } catch (e) {}

    existingData.answers = sanitizedAnswers;
    existingData.lastAutosavedAt = now.toISOString();

    await prisma.taskSubmission.update({
      where: { id: sub.id },
      data: {
        submissionDataJson: JSON.stringify(existingData),
      },
    });

    return NextResponse.json({
      success: true,
      lastAutosavedAt: existingData.lastAutosavedAt,
      answersCount: Object.keys(sanitizedAnswers).length,
    });
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Autosave progress error:', error);
    return NextResponse.json({ error: error.message || 'Failed to autosave quiz progress' }, { status: 500 });
  }
}
