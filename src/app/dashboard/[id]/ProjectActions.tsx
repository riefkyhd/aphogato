"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

function syncToastMessage(
  added: number,
  removed: number,
  skippedDuplicates: number,
  newlySelected: number,
  newlyDeselected: number
): string {
  const parts: string[] = [];
  if (added > 0) {
    parts.push(`${added} new photo${added === 1 ? "" : "s"} added`);
  }
  if (removed > 0) {
    parts.push(`${removed} photo${removed === 1 ? "" : "s"} removed`);
  }
  if (skippedDuplicates > 0) {
    parts.push(
      `${skippedDuplicates} duplicate${skippedDuplicates === 1 ? "" : "s"} skipped`
    );
  }
  if (newlySelected > 0) {
    parts.push(
      `${newlySelected} new client selection${newlySelected === 1 ? "" : "s"}`
    );
  }
  if (newlyDeselected > 0) {
    parts.push(
      `${newlyDeselected} client selection${newlyDeselected === 1 ? "" : "s"} removed`
    );
  }
  if (parts.length === 0) return "Already up to date";
  return parts.join(" · ");
}

function countSelectionChanges(
  before: Photo[],
  after: Photo[]
): { newlySelected: number; newlyDeselected: number } {
  const beforeSelected = new Set(
    before.filter((p) => p.is_selected).map((p) => p.id)
  );
  const afterSelected = new Set(
    after.filter((p) => p.is_selected).map((p) => p.id)
  );
  let newlySelected = 0;
  let newlyDeselected = 0;
  for (const id of afterSelected) {
    if (!beforeSelected.has(id)) newlySelected++;
  }
  for (const id of beforeSelected) {
    if (!afterSelected.has(id)) newlyDeselected++;
  }
  return { newlySelected, newlyDeselected };
}

export function ProjectActions({
  projectId,
  galleryToken,
  status,
  photos,
  onPhotosSynced,
  onDeleteProject,
  upload,
}: {
  projectId: string;
  galleryToken: string;
  status: ProjectStatus;
  photos: Photo[];
  onPhotosSynced: (photos: Photo[]) => void;
  onDeleteProject: () => void;
  upload: ProjectPhotoUpload;
}) {
  const selectedFilenames = photos
    .filter((ph) => ph.is_selected)
    .map((ph) => ph.filename);
  const router = useRouter();
  const [statusBusy, setStatusBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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
    const photosBeforeSync = photos;
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
      const skippedDuplicates = json.skipped_duplicates ?? 0;
      const duplicateWarnings = Array.isArray(json.duplicate_warnings)
        ? (json.duplicate_warnings as string[])
        : [];
      const syncedPhotos = Array.isArray(json.photos)
        ? (json.photos as Photo[])
        : photosBeforeSync;
      const { newlySelected, newlyDeselected } = countSelectionChanges(
        photosBeforeSync,
        syncedPhotos
      );
      toast.success(
        syncToastMessage(
          added,
          removed,
          skippedDuplicates,
          newlySelected,
          newlyDeselected
        )
      );
      if (duplicateWarnings.length > 0) {
        toast.warning(
          duplicateWarnings.length === 1
            ? duplicateWarnings[0]
            : `${duplicateWarnings.length} duplicates skipped — ${duplicateWarnings.slice(0, 2).join("; ")}${duplicateWarnings.length > 2 ? "…" : ""}`
        );
      }
      if (Array.isArray(json.photos)) {
        onPhotosSynced(syncedPhotos);
        router.refresh();
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
    <div className="w-full lg:w-auto lg:max-w-md shrink-0">
      <div className="flex flex-wrap gap-2">
        <PhotoUploadButton upload={upload} size="sm" className="shrink-0" />
        <Button size="sm" variant="secondary" onClick={copyLink} className="shrink-0">
          Copy link
        </Button>
        {nextStatus && (
          <Button
            size="sm"
            onClick={advanceStatus}
            loading={statusBusy}
            disabled={statusBusy}
            className="shrink-0"
          >
            {statusBusy ? "Updating…" : STATUS_LABEL[status]}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setMoreOpen((o) => !o)}
          className="shrink-0 lg:hidden"
          aria-expanded={moreOpen}
        >
          {moreOpen ? "Less" : "More"}
        </Button>
      </div>

      <div className="hidden lg:flex flex-wrap gap-2 mt-2 justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={syncGallery}
          loading={syncing}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Sync gallery"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={downloadList}
          disabled={selectedFilenames.length === 0}
        >
          Download list
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onDeleteProject}
          className="!text-status-editing !border-status-editing/40 hover:!border-status-editing"
        >
          Delete project
        </Button>
      </div>

      {moreOpen && (
        <div className="flex flex-wrap gap-2 mt-2 lg:hidden">
          <Button
            size="sm"
            variant="secondary"
            onClick={syncGallery}
            loading={syncing}
            disabled={syncing}
            className="flex-1 min-w-[calc(50%-0.25rem)]"
          >
            {syncing ? "Syncing…" : "Sync gallery"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={downloadList}
            disabled={selectedFilenames.length === 0}
            className="flex-1 min-w-[calc(50%-0.25rem)]"
          >
            Download list
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onDeleteProject}
            className="w-full !text-status-editing !border-status-editing/40 hover:!border-status-editing"
          >
            Delete project
          </Button>
        </div>
      )}
    </div>
  );
}
