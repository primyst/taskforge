"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  relatedTaskId: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: "Task assigned",
  COMMENT: "New comment",
  DUE_SOON: "Due soon",
  INVITE: "Team invite",
  MENTION: "Mention",
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "PATCH" });
  }

  async function handleClickNotification(n: Notification) {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
    }
    setOpen(false);
    if (n.relatedTaskId) {
      router.push(`/dashboard/tasks/${n.relatedTaskId}`);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"
        aria-label="Notifications"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#F5A623] rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-[#171B2E] border border-white/10 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#8B93A7] hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <p className="text-sm text-[#5B6270] px-4 py-6 text-center">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-[#5B6270] px-4 py-6 text-center">
              No notifications yet
            </p>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors ${
                    !n.read ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="text-xs font-[family-name:var(--font-mono)] uppercase text-[#8B93A7]">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 bg-[#F5A623] rounded-full mt-1 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm">{n.message}</p>
                  <span className="text-xs text-[#5B6270]">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}