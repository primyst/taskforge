"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteMemberForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/teams/${teamId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setEmail("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border border-white/15 hover:border-white/30 transition-colors rounded-md px-3 py-1.5 text-xs font-medium"
      >
        + Invite member
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/[0.04] border border-white/10 rounded-lg p-3 space-y-2 mb-3"
    >
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          required
          autoFocus
          placeholder="teammate@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
          className="rounded-md border border-white/15 bg-white/[0.04] px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
        >
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <p className="text-[11px] text-[#5B6270]">
        They must already have a TaskForge account.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="flex-1 border border-white/15 hover:border-white/30 transition-colors rounded-md py-1.5 text-xs font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md py-1.5 text-xs font-medium disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send invite"}
        </button>
      </div>
    </form>
  );
}