import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskAccess } from "@/lib/rbac";

const f = createUploadthing();

export const ourFileRouter = {
  taskAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "2MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }

      const taskId = req.headers.get("x-task-id");
      if (!taskId) {
        throw new UploadThingError("Missing taskId");
      }

      try {
        await requireTaskAccess(session.user.id, taskId);
      } catch {
        throw new UploadThingError("You don't have access to this task");
      }

      return { userId: session.user.id, taskId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.attachment.create({
        data: {
          taskId: metadata.taskId,
          url: file.ufsUrl,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedById: metadata.userId,
        },
      });

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;