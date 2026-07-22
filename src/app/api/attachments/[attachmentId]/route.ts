import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, RbacError } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attachmentId } = await params;

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: { include: { project: true } } },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const membership = await requireTeamMember(
      session.user.id,
      attachment.task.project.teamId
    );

    const isPrivileged = membership.role === "OWNER" || membership.role === "ADMIN";
    if (attachment.uploadedById !== session.user.id && !isPrivileged) {
      throw new RbacError("You can only delete attachments you uploaded", 403);
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}