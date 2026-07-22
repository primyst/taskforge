import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import CreateProjectForm from "./create-project-form";
import InviteMemberForm from "./invite-member-form";
import MembersList from "./members-list";
import AppNav from "../../app-nav";

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
      <AppNav userLabel={session.user.name ?? session.user.email ?? ""} />

      <section className="max-w-6xl mx-auto px-6 pt-8 pb-24">
        <Link
          href="/dashboard"
          className="text-sm text-[#8B93A7] hover:text-white transition-colors"
        >
          ← All teams
        </Link>

        <div className="flex items-start justify-between mt-4 mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            {team.name}
          </h1>
          {canManage && <CreateProjectForm teamId={team.id} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7]">
                Members ({team.members.length})
              </h2>
              {canManage && <InviteMemberForm teamId={team.id} />}
            </div>
            <MembersList
              teamId={team.id}
              members={team.members}
              canManage={canManage}
              currentUserId={session.user.id}
              currentUserRole={membership.role}
            />
          </div>
        </div>
      </section>
    </main>
  );
}