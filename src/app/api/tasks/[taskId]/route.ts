import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskAccess, RbacError } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { sendTaskAssignedEmail } from "@/lib/email";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  try {
    await requireTaskAccess(session.user.id, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true, image: true } },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { task: taskRef } = await requireTaskAccess(session.user.id, taskId);
    const { assigneeId, dueDate, ...rest } = parsed.data;

    if (assigneeId) {
      const assigneeMembership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: taskRef.project.teamId, userId: assigneeId },
        },
      });
      if (!assigneeMembership) {
        return NextResponse.json(
          { error: "Assignee must be a member of the team" },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    });

    if (assigneeId && assigneeId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          message: `You were assigned a task: ${task.title}`,
          relatedTaskId: task.id,
        },
      });

      const assigneeUser = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { email: true },
      });
      if (assigneeUser) {
        sendTaskAssignedEmail({
          to: assigneeUser.email,
          taskTitle: task.title,
          taskId: task.id,
          assignedByName: session.user.name ?? "A teammate",
        });
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  try {
    const { task: taskRef, membership } = await requireTaskAccess(session.user.id, taskId);

    const isPrivileged = membership.role === "OWNER" || membership.role === "ADMIN";
    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true },
    });
    const isOwnTask = fullTask?.createdById === session.user.id;

    if (!isPrivileged && !isOwnTask) {
      throw new RbacError("You can only delete tasks you created", 403);
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}