import Link from "next/link";

const boardColumns = [
  {
    title: "To do",
    tasks: [
      { title: "Design onboarding flow", tag: null },
      { title: "Set up Stripe webhooks", tag: null },
    ],
  },
  {
    title: "In progress",
    tasks: [
      { title: "Migrate auth to Auth.js v5", tag: null },
      { title: "Write API docs for /tasks endpoint", tag: "AI" },
    ],
  },
  {
    title: "Done",
    tasks: [{ title: "Ship notifications system", tag: null }],
  },
];

const capabilities = [
  {
    title: "Teams with real roles",
    body: "Owner, Admin, Member. Every API route resolves a resource back to its team and checks membership + role before reading or writing anything.",
  },
  {
    title: "AI task generation",
    body: "Describe a goal in plain language. Groq (Llama 3.3 70B) returns structured JSON, which gets validated and capped before it ever touches the database.",
  },
  {
    title: "Comments and files, in context",
    body: "Threaded discussion per task. Attachments upload direct-to-storage via UploadThing, with type and size re-checked server-side.",
  },
  {
    title: "Notifications, two ways",
    body: "An in-app bell for anything happening now, plus email for assignments, comments, and invites — sent through plain Nodemailer/Gmail SMTP.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F1222] text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          TaskForge
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/primyst/taskforge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#8B93A7] hover:text-white transition-colors"
          >
            Source
          </a>
          <Link
            href="/login"
            className="text-sm text-[#8B93A7] hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-4 py-2 font-medium"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#F5A623] mb-4">
            Project management, with AI task generation
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            Describe the goal.
            <br />
            Watch the tasks appear.
          </h1>
          <p className="text-[#8B93A7] text-lg leading-relaxed mb-8 max-w-lg">
            TaskForge is a full-stack project management app: teams, projects,
            a kanban board, comments, file attachments, and an AI assistant
            that turns a one-line goal into a structured set of tasks.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-5 py-3 text-sm font-medium"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="border border-white/15 hover:border-white/30 transition-colors rounded-md px-5 py-3 text-sm font-medium"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {boardColumns.map((col) => (
            <div
              key={col.title}
              className="bg-white/[0.04] border border-white/10 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[#8B93A7]">
                  {col.title}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#8B93A7]">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.tasks.map((task) => (
                  <div
                    key={task.title}
                    className="bg-[#F7F8FB] text-[#0F1222] rounded-lg px-3 py-2.5 text-sm font-medium flex items-start justify-between gap-2"
                  >
                    <span>{task.title}</span>
                    {task.tag && (
                      <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] bg-[#F5A623]/15 text-[#F5A623] rounded px-1.5 py-0.5 tracking-wide">
                        {task.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F7F8FB] text-[#0F1222] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7] mb-8">
            What's in the system
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {capabilities.map((cap) => (
              <div key={cap.title}>
                <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg mb-2">
                  {cap.title}
                </h3>
                <p className="text-[#5B6270] text-sm leading-relaxed">{cap.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7] mb-6">
          How access control actually works
        </h2>
        <p className="text-[#8B93A7] text-sm leading-relaxed max-w-lg mb-6">
          Every route that touches a task, project, or team calls one of a
          few shared helpers before doing anything else. This is the actual
          function a task-fetch route runs:
        </p>
        <pre className="bg-white/[0.04] border border-white/10 rounded-xl p-5 overflow-x-auto text-sm">
          <code className="font-[family-name:var(--font-mono)] text-[#C9CDD8] leading-relaxed">
{`export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, project: { select: { teamId: true } } },
  });

  if (!task) throw new RbacError("Task not found", 404);

  const membership = await requireTeamMember(userId, task.project.teamId);
  return { task, membership };
}`}
          </code>
        </pre>
        <p className="text-[#5B6270] text-sm mt-4">
          No client-supplied team or role ID is ever trusted — access is
          re-derived from the database on every request.
        </p>
      </section>
    </main>
  );
}