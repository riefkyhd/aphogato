"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { PhotoUploadButton } from "@/components/PhotoUploadButton";
import type { ProjectPhotoUpload } from "@/hooks/useProjectPhotoUpload";
import type { Photo } from "@/lib/types";
import type { ProjectStatus } from "@/components/StatusDot";

const NEXT_STATUS: Record<ProjectStatus, ProjectStatus | null> = {
  pending: null,
  selected: "editing",
  editing: "delivered",
  delivered: null,
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: "Pending",
  selected: "Start editing",
  editing: "Mark delivered",
  delivered: "Delivered",
};

function syncToastMessage(added: number, removed: number): string {
  if (added === 0 && removed === 0) return "Already up to date";

  const parts: string[] = [];
  if (added > 0) {
    parts.push(`${added} new photo${added === 1 ? "" : "s"} added`);
  }
  if (removed > 0) {
    parts.push(`${removed} photo${removed === 1 ? "" : "s"} removed`);
  }
  return parts.join(", ");
}

export function ProjectActions({
  projectId,
  galleryToken,
  status,
  selectedFilenames,
  onPhotosSynced,
  upload,
}: {
  projectId: string;
  galleryToken: string;
  status: ProjectStatus;
  selectedFilenames: string[];
  onPhotosSynced: (photos: Photo[]) => void;
  upload: ProjectPhotoUpload;
}) {
  const router = useRouter();
  const [statusBusy, setStatusBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/gallery/${galleryToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Gallery link copied");
  }

  function downloadList() {
    if (selectedFilenames.length === 0) {
      toast.error("No photos selected yet");
      return;
    }
    const blob = new Blob([selectedFilenames.join("\n") + "\n"], {
      type: "text/plain",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `selected-photos-${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function syncGallery() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sync`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Failed to sync gallery");
        return;
      }
      const added = json.added ?? 0;
      const removed = json.removed ?? 0;
      toast.success(syncToastMessage(added, removed));
      if (Array.isArray(json.photos)) {
        onPhotosSynced(json.photos as Photo[]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sync gallery");
    } finally {
      setSyncing(false);
    }
  }

  async function advanceStatus() {
    const next = NEXT_STATUS[status];
    if (!next) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to update status");
        return;
      }
      toast.success(`Status → ${next}`);
      router.refresh();
    } finally {
      setStatusBusy(false);
    }
  }

  const nextStatus = NEXT_STATUS[status];

  return (
    <div className="flex flex-wrap items-start gap-3">
      <PhotoUploadButton upload={upload} />
      <Button variant="secondary" onClick={copyLink}>
        Copy link
      </Button>
      <Button
        variant="secondary"
        onClick={downloadList}
        disabled={selectedFilenames.length === 0}
      >
        Download list
      </Button>
      <Button
        variant="secondary"
        onClick={syncGallery}
        disabled={syncing}
        className="inline-flex items-center gap-2"
      >
        {syncing && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        {syncing ? "Syncing…" : "Sync gallery"}
      </Button>
      {nextStatus && (
        <Button onClick={advanceStatus} disabled={statusBusy}>
          {statusBusy ? "Updating…" : STATUS_LABEL[status]}
        </Button>
      )}
    </div>
  );
}
