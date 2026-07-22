import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import CommentSection from "./comment-section";
import AttachmentUpload from "./attachment-upload";
import DeleteAttachmentButton from "./delete-attachment-button";
import AppNav from "../../app-nav";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true, teamId: true } },
      assignee: { select: { id: true, name: true, image: true } },
      createdBy: { select: { id: true, name: true, image: true } },
      comments: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          authorId: true,
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!task) {
    notFound();
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId: task.project.teamId, userId: userId },
    },
  });

  if (!membership) {
    notFound();
  }

  const priorityColors: Record<string, string> = {
    LOW: "text-[#8B93A7] bg-white/[0.06]",
    MEDIUM: "text-[#8B93A7] bg-white/[0.06]",
    HIGH: "text-[#F5A623] bg-[#F5A623]/15",
    URGENT: "text-red-400 bg-red-500/15",
  };

  return (
    <main className="min-h-screen bg-[#0F1222] text-white">
      <AppNav userLabel={session.user.name ?? session.user.email ?? ""} maxWidth="max-w-3xl" />

      <section className="max-w-3xl mx-auto px-6 pt-8 pb-24">
        <Link
          href={`/dashboard/projects/${task.project.id}`}
          className="text-sm text-[#8B93A7] hover:text-white transition-colors"
        >
          ← Back to {task.project.name}
        </Link>

        <div className="mt-4 mb-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              {task.title}
            </h1>
            {task.aiGenerated && (
              <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] bg-[#F5A623]/15 text-[#F5A623] rounded px-1.5 py-0.5 mt-1">
                AI generated
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span
              className={`font-[family-name:var(--font-mono)] text-[10px] uppercase rounded px-1.5 py-0.5 ${priorityColors[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-[#8B93A7] bg-white/[0.06] rounded px-1.5 py-0.5">
              {task.status.replace("_", " ")}
            </span>
          </div>

          {task.description && (
            <p className="text-[#8B93A7] leading-relaxed mb-4">{task.description}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-[#5B6270]">
            <span>Created by {task.createdBy.name}</span>
            {task.assignee && <span>Assigned to {task.assignee.name}</span>}
            {task.dueDate && (
              <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {task.attachments.length > 0 && (
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7] mb-3">
              Attachments
            </h2>
            <div className="space-y-2">
              {task.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-sm"
                >
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {att.filename}
                  </a>
                  <div className="flex items-center gap-3">
                    <span className="text-[#5B6270]">
                      {(att.fileSize / 1024).toFixed(0)} KB
                    </span>
                    {(att.uploadedById === userId ||
                      membership.role === "OWNER" ||
                      membership.role === "ADMIN") && (
                      <DeleteAttachmentButton attachmentId={att.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AttachmentUpload taskId={task.id} />

        <CommentSection
          taskId={task.id}
          initialComments={task.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
          }))}
          currentUserId={userId}
        />
      </section>
    </main>
  );
}
