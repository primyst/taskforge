import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateTeamForm from "./create-team-form";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    select: {
      id: true,
      name: true,
      createdAt: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true },
      },
      _count: { select: { members: true, projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#0F1222] text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          TaskForge
        </span>
        <span className="text-sm text-[#8B93A7]">
          {session.user.name ?? session.user.email}
        </span>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
            Your teams
          </h1>
          <CreateTeamForm />
        </div>

        {teams.length === 0 ? (
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-10 text-center">
            <p className="text-[#8B93A7] mb-1">No teams yet.</p>
            <p className="text-sm text-[#5B6270]">
              Create one to start organizing projects and tasks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className="bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors rounded-xl p-5 block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-[family-name:var(--font-display)] font-semibold text-lg">
                    {team.name}
                  </h2>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide bg-[#4F46E5]/15 text-[#8B93A7] rounded px-1.5 py-0.5">
                    {team.members[0]?.role}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-[#8B93A7]">
                  <span>{team._count.members} members</span>
                  <span>{team._count.projects} projects</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}