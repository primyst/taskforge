import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskAccess } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { sendCommentEmail } from "@/lib/email";

const createCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    await requireTaskAccess(session.user.id, taskId);

    const comments = await prisma.comment.findMany({
      where: { taskId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`comment:create:${session.user.id}`, 100, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many comments posted recently. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { taskId, content } = parsed.data;

  try {
    const { task: taskRef } = await requireTaskAccess(session.user.id, taskId);

    const userId = session.user.id;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, createdById: true, title: true },
    });

    const notifyUserIds = new Set(
      [task?.assigneeId, task?.createdById].filter(
        (id): id is string => !!id && id !== userId
      )
    );

    if (notifyUserIds.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(notifyUserIds).map((uid) => ({
          userId: uid,
          type: "COMMENT" as const,
          message: `New comment on: ${task?.title}`,
          relatedTaskId: taskId,
        })),
      });

      const usersToEmail = await prisma.user.findMany({
        where: { id: { in: Array.from(notifyUserIds) } },
        select: { email: true },
      });
      for (const u of usersToEmail) {
        sendCommentEmail({
          to: u.email,
          taskTitle: task?.title ?? "a task",
          taskId,
          commenterName: session.user.name ?? "A teammate",
        });
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}