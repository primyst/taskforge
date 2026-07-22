"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  aiGenerated: boolean;
  dueDate: string | null;
  assignee: { id: string; name: string; image: string | null } | null;
  _count: { comments: number; attachments: number };
};

type TeamMember = { id: string; name: string; email: string };

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "DONE", label: "Done" },
];

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  LOW: "text-[#8B93A7] bg-white/[0.06]",
  MEDIUM: "text-[#8B93A7] bg-white/[0.06]",
  HIGH: "text-[#F5A623] bg-[#F5A623]/15",
  URGENT: "text-red-400 bg-red-500/15",
};

export default function TaskBoard({
  projectId,
  initialTasks,
  teamMembers,
  currentUserId,
}: {
  projectId: string;
  initialTasks: Task[];
  teamMembers: TeamMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [showCreate, setShowCreate] = useState(false);
  const [showAi, setShowAi] = useState(false);

  async function updateStatus(taskId: string, status: Task["status"]) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-4 py-2 text-sm font-medium"
        >
          + New task
        </button>
        <button
          onClick={() => setShowAi(true)}
          className="border border-[#F5A623]/40 text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors rounded-md px-4 py-2 text-sm font-medium"
        >
          ✦ Generate with AI
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-3 min-h-[200px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[#8B93A7]">
                  {col.label}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#5B6270]">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#F7F8FB] text-[#0F1222] rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium">{task.title}</span>
                      {task.aiGenerated && (
                        <span className="shrink-0 font-[family-name:var(--font-mono)] text-[9px] bg-[#F5A623]/15 text-[#B36B00] rounded px-1.5 py-0.5">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-[family-name:var(--font-mono)] text-[9px] uppercase rounded px-1.5 py-0.5 ${PRIORITY_COLORS[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateStatus(task.id, e.target.value as Task["status"])
                        }
                        className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(task._count.comments > 0 || task._count.attachments > 0) && (
                      <div className="flex gap-3 mt-2 text-[11px] text-gray-400">
                        {task._count.comments > 0 && <span>{task._count.comments} comments</span>}
                        {task._count.attachments > 0 && <span>{task._count.attachments} files</span>}
                      </div>
                    )}
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-[#5B6270] px-1 py-2">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          projectId={projectId}
          teamMembers={teamMembers}
          onClose={() => setShowCreate(false)}
          onCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {showAi && (
        <AiGenerateModal
          projectId={projectId}
          onClose={() => setShowAi(false)}
          onCreated={(newTasks) => {
            setTasks((prev) => [...newTasks, ...prev]);
            setShowAi(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({
  projectId,
  teamMembers,
  onClose,
  onCreated,
}: {
  projectId: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined,
        projectId,
        priority,
        assigneeId: assigneeId || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    const assignee = teamMembers.find((m) => m.id === assigneeId) ?? null;
    onCreated({
      ...data.task,
      assignee: assignee ? { id: assignee.id, name: assignee.name, image: null } : null,
      _count: { comments: 0, attachments: 0 },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#0F1222] border border-white/10 rounded-xl p-6 space-y-4"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          New task
        </h2>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label className="text-sm text-[#8B93A7]">Title</label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        <div>
          <label className="text-sm text-[#8B93A7]">Description (optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-[#8B93A7]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="mt-1 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[#8B93A7]">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-white/15 hover:border-white/30 transition-colors rounded-md py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AiGenerateModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: (tasks: Task[]) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/ai/generate-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, prompt }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    const newTasks: Task[] = data.tasks.map(
      (t: {
        id: string;
        title: string;
        description: string | null;
        status: Task["status"];
        priority: Task["priority"];
        aiGenerated: boolean;
        dueDate: string | null;
      }) => ({
        ...t,
        assignee: null,
        _count: { comments: 0, attachments: 0 },
      })
    );

    onCreated(newTasks);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#0F1222] border border-[#F5A623]/30 rounded-xl p-6 space-y-4"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Generate tasks with AI
        </h2>
        <p className="text-sm text-[#8B93A7]">
          Describe the goal. TaskForge will break it into 3–8 tasks.
        </p>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <textarea
          required
          rows={4}
          autoFocus
          minLength={5}
          placeholder="e.g. Build a landing page for our new product launch"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F5A623] resize-none"
        />

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-white/15 hover:border-white/30 transition-colors rounded-md py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#F5A623] text-[#0F1222] hover:bg-[#E09612] transition-colors rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}