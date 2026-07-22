"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAttachmentButton({
  attachmentId,
}: {
  attachmentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/attachments/${attachmentId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}