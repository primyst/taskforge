import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskAccess } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const createAttachmentSchema = z.object({
  taskId: z.string().min(1),
  url: z.string().url(),
  filename: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
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

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploadedBy: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`attachment:create:${session.user.id}`, 20, 60 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Too many uploads recently. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createAttachmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { taskId, url, filename, fileType, fileSize } = parsed.data;

  if (!ALLOWED_MIME_TYPES.has(fileType)) {
    return NextResponse.json(
      { error: "This file type is not allowed" },
      { status: 400 }
    );
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 10MB size limit" },
      { status: 400 }
    );
  }

  try {
    await requireTaskAccess(session.user.id, taskId);

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        url,
        filename,
        fileType,
        fileSize,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}