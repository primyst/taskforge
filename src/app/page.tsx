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

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F1222] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          TaskForge
        </span>
        <div className="flex items-center gap-3">
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
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-2xl">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#F5A623] mb-4">
            AI-assisted project management
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            Describe the goal.
            <br />
            Watch the tasks appear.
          </h1>
          <p className="text-[#8B93A7] text-lg leading-relaxed mb-8 max-w-lg">
            TaskForge turns a one-line project brief into a structured task
            board — then gets out of your way. Teams, roles, comments, and
            files, all in one place.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-5 py-3 text-sm font-medium"
            >
              Start building — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="border border-white/15 hover:border-white/30 transition-colors rounded-md px-5 py-3 text-sm font-medium"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Signature: live-looking kanban board */}
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

      {/* Feature grid */}
      <section className="bg-[#F7F8FB] text-[#0F1222] py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg mb-2">
              Teams with real roles
            </h3>
            <p className="text-[#5B6270] text-sm leading-relaxed">
              Owners, admins, and members — permissions that actually mean
              something, enforced on every request.
            </p>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg mb-2">
              Comments &amp; files, in context
            </h3>
            <p className="text-[#5B6270] text-sm leading-relaxed">
              Every task carries its own thread and attachments — no
              switching tools to find the file someone mentioned.
            </p>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] font-semibold text-lg mb-2">
              Notified, not spammed
            </h3>
            <p className="text-[#5B6270] text-sm leading-relaxed">
              Assignments and mentions reach your inbox. Everything else
              stays quietly in the activity feed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}