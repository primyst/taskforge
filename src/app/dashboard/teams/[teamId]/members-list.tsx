"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: { id: string; name: string; email: string; image: string | null };
};

const ROLE_STYLES: Record<Member["role"], string> = {
  OWNER: "text-[#F5A623] bg-[#F5A623]/15",
  ADMIN: "text-[#4F46E5] bg-[#4F46E5]/15",
  MEMBER: "text-[#8B93A7] bg-white/[0.06]",
};

export default function MembersList({
  teamId,
  members,
  canManage,
  currentUserId,
  currentUserRole,
}: {
  teamId: string;
  members: Member[];
  canManage: boolean;
  currentUserId: string;
  currentUserRole: Member["role"];
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    setError(null);
    setRemovingId(userId);

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    setRemovingId(null);

    if (!res.ok) {
      setError(data.error || "Couldn't remove member");
      return;
    }

    router.refresh();
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5 mb-3">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {members.map((m) => {
          const canRemoveThis =
            canManage &&
            m.user.id !== currentUserId &&
            m.role !== "OWNER" &&
            !(m.role === "ADMIN" && currentUserRole !== "OWNER");

          return (
            <div key={m.user.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center text-[10px] font-medium uppercase shrink-0">
                  {(m.user.name ?? m.user.email)[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate">{m.user.name}</p>
                  <p className="text-xs text-[#5B6270] truncate">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`font-[family-name:var(--font-mono)] text-[10px] uppercase rounded px-1.5 py-0.5 ${ROLE_STYLES[m.role]}`}
                >
                  {m.role}
                </span>
                {canRemoveThis && (
                  <button
                    onClick={() => handleRemove(m.user.id)}
                    disabled={removingId === m.user.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {removingId === m.user.id ? "..." : "Remove"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}