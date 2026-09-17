import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          include: {
            sender: { select: { fullName: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject || !category || !message) {
      return NextResponse.json({ error: 'Subject, category, and message are required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        category,
        status: 'OPEN',
        messages: {
          create: {
            senderId: user.id,
            message,
          },
        },
      },
      include: { messages: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket submitted successfully.',
      ticket,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
