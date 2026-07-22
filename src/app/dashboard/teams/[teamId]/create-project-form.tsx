"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjectForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined, teamId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setName("");
    setDescription("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-4 py-2 text-sm font-medium shrink-0"
      >
        + New project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[#0F1222] border border-white/10 rounded-xl p-6 space-y-4"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Create a project
        </h2>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label className="text-sm text-[#8B93A7]">Project name</label>
          <input
            type="text"
            required
            minLength={2}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>

        <div>
          <label className="text-sm text-[#8B93A7]">Description (optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
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