import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TaskBoard from "./task-board";

export default async function ProjectPage({
 params,
}: {
 params: Promise<{ projectId: string }>;
}) {
 const session = await auth();
 if (!session?.user?.id) {
   redirect("/login");
 }

 const { projectId } = await params;

 const project = await prisma.project.findUnique({
   where: { id: projectId },
   select: {
     id: true,
     name: true,
     description: true,
     status: true,
     teamId: true,
   },
 });

 if (!project) {
   notFound();
 }

 const membership = await prisma.teamMember.findUnique({
   where: { teamId_userId: { teamId: project.teamId, userId: session.user.id } },
 });

 if (!membership) {
   notFound();
 }

 const [tasks, teamMembers] = await Promise.all([
   prisma.task.findMany({
     where: { projectId },
     select: {
       id: true,
       title: true,
       description: true,
       status: true,
       priority: true,
       aiGenerated: true,
       dueDate: true,
       assignee: { select: { id: true, name: true, image: true } },
       _count: { select: { comments: true, attachments: true } },
     },
     orderBy: { createdAt: "desc" },
   }),
   prisma.teamMember.findMany({
     where: { teamId: project.teamId },
     select: { user: { select: { id: true, name: true, email: true } } },
   }),
 ]);

 const serializedTasks = tasks.map((task) => ({
   ...task,
   dueDate: task.dueDate ? task.dueDate.toISOString() : null,
 }));

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
         href={`/dashboard/teams/${project.teamId}`}
         className="text-sm text-[#8B93A7] hover:text-white transition-colors"
       >
         ← Back to team
       </Link>

       <div className="mt-4 mb-8">
         <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight mb-1">
           {project.name}
         </h1>
         {project.description && (
           <p className="text-[#8B93A7]">{project.description}</p>
         )}
       </div>

       <TaskBoard
         projectId={project.id}
         initialTasks={serializedTasks}
         teamMembers={teamMembers.map((m) => m.user)}
         currentUserId={session.user.id}
       />
     </section>
   </main>
 );
}
