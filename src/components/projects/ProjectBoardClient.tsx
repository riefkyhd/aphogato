"use client";

import { Images } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markProjectsStatusDirty } from "@/lib/projects/invalidateProjectsViews";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { ProjectBoardColumn } from "@/components/projects/ProjectBoardColumn";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import {
  MediaLoadStatusProvider,
  useMediaLoadFailedCount,
} from "@/components/media/MediaLoadStatus";
import { MediaUnavailableBanner } from "@/components/media/MediaUnavailable";
import {
  isCloudinaryAccountDisabled,
  MEDIA_UNAVAILABLE_BANNER_ADMIN,
} from "@/lib/cloudinary/accountStatus";
import type { CloudinaryAccountUsagePublic } from "@/lib/cloudinary/types";
import { FEATURES } from "@/lib/features";
import {
  BOARD_COLUMNS,
  groupProjectsByStatus,
  type BoardProject,
} from "@/lib/projects/board";
import type { ProjectStatus } from "@/lib/types";

function BoardStorageBanner() {
  const failedCount = useMediaLoadFailedCount();
  const [accountDisabled, setAccountDisabled] = useState(false);

  useEffect(() => {
    if (!FEATURES.cloudinarySettings) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/settings/cloudinary");
        if (!res.ok) return;
        const json = (await res.json()) as {
          usage?: CloudinaryAccountUsagePublic[];
        };
        if (cancelled) return;
        setAccountDisabled(
          (json.usage ?? []).some((entry) => isCloudinaryAccountDisabled(entry))
        );
      } catch {
        // Cover failures still surface the banner.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!FEATURES.photographerFirstUi && (accountDisabled || failedCount >= 2)) {
    return (
      <MediaUnavailableBanner
        message={
          accountDisabled
            ? "One or more Cloudinary accounts are disabled or inactive. Project covers and photos cannot load until those accounts are re-enabled in the Cloudinary console."
            : MEDIA_UNAVAILABLE_BANNER_ADMIN
        }
        className="mb-4"
      />
    );
  }

  return null;
}

export function ProjectBoardClient({
  initialProjects,
}: {
  initialProjects: BoardProject[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);
  const [hideDelivered, setHideDelivered] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(
    null
  );
  const [movingId, setMovingId] = useState<string | null>(null);

  const visibleProjects = useMemo(
    () =>
      hideDelivered
        ? projects.filter((p) => p.status !== "delivered")
        : projects,
    [projects, hideDelivered]
  );

  const grouped = useMemo(
    () => groupProjectsByStatus(visibleProjects),
    [visibleProjects]
  );

  const moveProject = useCallback(
    async (projectId: string, nextStatus: ProjectStatus) => {
      const current = projects.find((p) => p.id === projectId);
      if (!current || current.status === nextStatus) return;

      setMovingId(projectId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: nextStatus } : p
        )
      );

      try {
        const res = await fetch(`/api/projects/${projectId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to update status");
        const label =
          BOARD_COLUMNS.find((c) => c.status === nextStatus)?.label ??
          nextStatus;
        toast.success(`Moved to ${label}`);
        markProjectsStatusDirty();
        router.refresh();
      } catch (err) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, status: current.status } : p
          )
        );
        toast.error(
          err instanceof Error ? err.message : "Failed to update status"
        );
      } finally {
        setMovingId(null);
        setDragOverColumn(null);
      }
    },
    [projects, router]
  );

  const handleDrop = useCallback(
    (status: ProjectStatus, projectId: string) => {
      void moveProject(projectId, status);
    },
    [moveProject]
  );

  const columns = hideDelivered
    ? BOARD_COLUMNS.filter((c) => c.status !== "delivered")
    : BOARD_COLUMNS;

  return (
    <DashboardMain className="flex flex-col min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)]">
      <ProjectsPageHeader title="Pipeline" />

      <MediaLoadStatusProvider>
        <BoardStorageBanner />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-[12px] text-text-secondary max-w-xl">
            <span className="sm:hidden">
              Swipe columns, change stage on each card, tap to open the gallery.
            </span>
            <span className="hidden sm:inline">
              Drag cards between columns, or use the stage menu on each card. Open
              a card to work in the gallery.
            </span>
          </p>
          <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-label text-text-secondary cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={hideDelivered}
              onChange={(e) => setHideDelivered(e.target.checked)}
              className="accent-text-primary"
            />
            Hide delivered
          </label>
        </div>

        {projects.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <Images
              className="h-8 w-8 mx-auto text-text-muted mb-3"
              aria-hidden
            />
            <p className="text-[14px] text-text-primary">No projects yet</p>
            <p className="mt-2 text-[13px] text-text-secondary max-w-sm mx-auto leading-relaxed">
              Create your first gallery to start tracking it through the pipeline.
            </p>
            {FEATURES.newProject ? (
              <Link
                href="/dashboard/galleries/new"
                className="btn-primary inline-flex items-center justify-center mt-5"
              >
                New gallery
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto pb-4 snap-x snap-mandatory overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex gap-3 w-max min-w-full justify-center h-full pr-1">
              {columns.map((col) => (
                <ProjectBoardColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  hint={col.hint}
                  projects={grouped[col.status]}
                  dragOver={dragOverColumn === col.status}
                  movingId={movingId}
                  onDragOver={setDragOverColumn}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={handleDrop}
                  onStatusChange={moveProject}
                />
              ))}
            </div>
          </div>
        )}
      </MediaLoadStatusProvider>
    </DashboardMain>
  );
}
