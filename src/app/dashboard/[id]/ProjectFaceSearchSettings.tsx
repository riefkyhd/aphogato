"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { normalizeProject } from "@/lib/normalizeProject";
import type { FaceSearchStatus } from "@/lib/faces/types";
import { reindexUnindexedProjectPhotos } from "@/lib/faces/reindexProjectFaces";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

function statusLabel(status: FaceSearchStatus): string {
  if (!status.enabled) return "Off";
  if (status.status === "ready") return "Ready";
  if (status.status === "partial") return "Indexing";
  return "Not indexed";
}

function statusDotClass(status: FaceSearchStatus): string {
  if (!status.enabled) return "bg-text-muted";
  if (status.status === "ready") return "bg-status-delivered";
  if (status.status === "partial") return "bg-status-editing";
  return "bg-text-muted";
}

export function ProjectFaceSearchSettings({
  project,
  photoCount,
  onUpdated,
}: {
  project: Project;
  photoCount: number;
  onUpdated: (project: Project) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [faceStatus, setFaceStatus] = useState<FaceSearchStatus | null>(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/faces/status`);
      const json = (await res.json()) as FaceSearchStatus & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load face search status");
      }
      setFaceStatus(json);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load face search status"
      );
    } finally {
      setStatusLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (project.face_search_enabled) {
      void loadStatus();
      return;
    }
    setFaceStatus({
      enabled: false,
      totalPhotos: photoCount,
      indexedPhotos: 0,
      faceCount: 0,
      status: "none",
    });
  }, [project.face_search_enabled, photoCount, loadStatus]);

  async function handleToggle() {
    const nextEnabled = !project.face_search_enabled;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ face_search_enabled: nextEnabled }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update face search");
        return;
      }
      if (json.project) {
        onUpdated(normalizeProject(json.project));
        toast.success(
          nextEnabled ? "Face search enabled" : "Face search disabled"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleIndexMissing() {
    setIndexing(true);
    setIndexProgress(null);
    try {
      const result = await reindexUnindexedProjectPhotos(
        project.id,
        (done, total, fileName) => {
          setIndexProgress(`${done} / ${total} — ${fileName}`);
        }
      );
      await loadStatus();
      if (result.errors.length > 0) {
        toast.warning(
          `Indexed ${result.indexed} photos (${result.skipped} without faces). ${result.errors.length} failed.`
        );
      } else {
        toast.success(
          `Indexed ${result.indexed} photos${result.skipped > 0 ? ` · ${result.skipped} without detectable faces` : ""}`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Indexing failed");
    } finally {
      setIndexing(false);
      setIndexProgress(null);
    }
  }

  const displayStatus = faceStatus ?? {
    enabled: project.face_search_enabled,
    totalPhotos: photoCount,
    indexedPhotos: 0,
    faceCount: 0,
    status: "none" as const,
  };

  return (
    <div className="bg-bg-secondary px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-label text-text-muted">
            Face search for clients
          </p>
          <p className="mt-1 text-[12px] text-text-secondary leading-relaxed max-w-prose">
            Let clients tap their face in the gallery to filter photos. Best
            for sports teams and large group events.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={saving}
          disabled={saving}
          onClick={() => void handleToggle()}
          className="shrink-0"
        >
          {project.face_search_enabled ? "Disable" : "Enable"}
        </Button>
      </div>

      {project.face_search_enabled ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-label">
            <span className="inline-flex items-center gap-2 text-text-primary">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusDotClass(displayStatus)
                )}
                aria-hidden
              />
              {statusLoading ? "Loading…" : statusLabel(displayStatus)}
            </span>
            <span className="text-text-muted tabular-nums">
              {displayStatus.indexedPhotos} / {displayStatus.totalPhotos} photos
              indexed
            </span>
            {displayStatus.faceCount > 0 ? (
              <span className="text-text-muted tabular-nums">
                {displayStatus.faceCount} face
                {displayStatus.faceCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          {displayStatus.status === "none" && photoCount > 0 ? (
            <p className="mt-2 text-[12px] text-text-muted leading-relaxed">
              Upload new photos to index automatically, or index existing photos
              below. Uses Cloudinary delivery once per photo (~640px wide).
            </p>
          ) : null}
          {displayStatus.status === "partial" ? (
            <p className="mt-2 text-[12px] text-status-editing leading-relaxed">
              Indexing incomplete — clients may see limited results until most
              photos are indexed.
            </p>
          ) : null}
          {photoCount > 0 &&
          displayStatus.indexedPhotos < displayStatus.totalPhotos ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={indexing}
                disabled={indexing || saving}
                onClick={() => void handleIndexMissing()}
              >
                Index missing photos
              </Button>
              {indexProgress ? (
                <span className="text-[11px] text-text-muted truncate">
                  {indexProgress}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
