import Link from "next/link";
import NotificationBell from "./notification-bell";

export default function AppNav({
  userLabel,
  maxWidth = "max-w-6xl",
}: {
  userLabel: string;
  maxWidth?: string;
}) {
  return (
    <nav className={`flex items-center justify-between px-6 py-5 ${maxWidth} mx-auto`}>
      <Link
        href="/dashboard"
        className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
      >
        TaskForge
      </Link>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="text-sm text-[#8B93A7]">{userLabel}</span>
      </div>
    </nav>
  );
}