"use client";

import { useState } from "react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: { id: string; name: string; image: string | null };
};

export default function CommentSection({
  taskId,
  initialComments,
  currentUserId,
}: {
  taskId: string;
  initialComments: Comment[];
  currentUserId: string;
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setLoading(true);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, content }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setComments((prev) => [
      ...prev,
      { ...data.comment, authorId: currentUserId },
    ]);
    setContent("");
  }

  async function handleDelete(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      window.location.reload();
    }
  }

  return (
    <div>
      <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7] mb-4">
        Comments ({comments.length})
      </h2>

      <div className="space-y-3 mb-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white/[0.04] border border-white/10 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{comment.author.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5B6270]">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
                {comment.authorId === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-[#C9CDD8] whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-[#5B6270]">No comments yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <textarea
          rows={3}
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5] resize-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post comment"}
        </button>
      </form>
    </div>
  );
}