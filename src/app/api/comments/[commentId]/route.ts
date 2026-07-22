import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, RbacError } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

async function loadCommentWithAccess(commentId: string) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: { include: { project: true } } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const comment = await loadCommentWithAccess(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await requireTeamMember(session.user.id, comment.task.project.teamId);

    if (comment.authorId !== session.user.id) {
      throw new RbacError("You can only edit your own comments", 403);
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ comment: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;

  try {
    const comment = await loadCommentWithAccess(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const membership = await requireTeamMember(session.user.id, comment.task.project.teamId);

    const isPrivileged = membership.role === "OWNER" || membership.role === "ADMIN";
    if (comment.authorId !== session.user.id && !isPrivileged) {
      throw new RbacError("You can only delete your own comments", 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}