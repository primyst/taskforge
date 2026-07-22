import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import CreateProjectForm from "./create-project-form";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { teamId } = await params;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
  });

  if (!membership) {
    notFound();
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <main className="min-h-screen bg-[#0F1222] text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
        >
          TaskForge
        </Link>
        <span className="text-sm text-[#8B93A7]">
          {session.user.name ?? session.user.email}
        </span>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-8 pb-24">
        <Link
          href="/dashboard"
          className="text-sm text-[#8B93A7] hover:text-white transition-colors"
        >
          ← All teams
        </Link>

        <div className="flex items-start justify-between mt-4 mb-10">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight mb-2">
              {team.name}
            </h1>
            <div className="flex -space-x-2">
              {team.members.slice(0, 6).map((m) => (
                <div
                  key={m.user.id}
                  title={m.user.name ?? m.user.email}
                  className="w-7 h-7 rounded-full bg-[#4F46E5] border-2 border-[#0F1222] flex items-center justify-center text-[10px] font-medium uppercase"
                >
                  {(m.user.name ?? m.user.email)[0]}
                </div>
              ))}
              <span className="ml-4 text-sm text-[#8B93A7] self-center">
                {team.members.length} member{team.members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {canManage && <CreateProjectForm teamId={team.id} />}
        </div>

        <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7] mb-4">
          Projects
        </h2>

        {team.projects.length === 0 ? (
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-10 text-center">
            <p className="text-[#8B93A7] mb-1">No projects yet.</p>
            <p className="text-sm text-[#5B6270]">
              {canManage
                ? "Create one to start assigning tasks."
                : "An admin or owner needs to create one."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors rounded-xl p-5 block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-[family-name:var(--font-display)] font-semibold">
                    {project.name}
                  </h3>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide bg-white/[0.06] text-[#8B93A7] rounded px-1.5 py-0.5">
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-[#8B93A7] mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <span className="text-sm text-[#5B6270]">
                  {project._count.tasks} task{project._count.tasks !== 1 ? "s" : ""}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}