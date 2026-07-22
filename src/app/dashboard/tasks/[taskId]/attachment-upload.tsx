"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";

export default function AttachmentUpload({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mb-8">
      <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#8B93A7] mb-3">
        Add attachment
      </h2>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <UploadDropzone
        endpoint="taskAttachment"
        headers={{ "x-task-id": taskId }}
        onClientUploadComplete={() => {
          setError(null);
          router.refresh();
        }}
        onUploadError={(err) => {
          setError(err.message || "Upload failed");
        }}
        appearance={{
          container: {
            borderColor: "rgba(255,255,255,0.15)",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: "12px",
          },
          label: { color: "#8B93A7", fontSize: "13px" },
          allowedContent: { color: "#5B6270", fontSize: "11px" },
          button: {
            backgroundColor: "#4F46E5",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}