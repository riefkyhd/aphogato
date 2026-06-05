"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectBoardColumn } from "@/components/projects/ProjectBoardColumn";
import { ProjectsPageHeader } from "@/components/projects/ProjectsPageHeader";
import {
  BOARD_COLUMNS,
  groupProjectsByStatus,
  type BoardProject,
} from "@/lib/projects/board";
import type { ProjectStatus } from "@/lib/types";

export function ProjectBoardClient({
  initialProjects,
}: {
  initialProjects: BoardProject[];
}) {
  const [projects, setProjects] = useState(initialProjects);
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
    [projects]
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
    <main className="px-4 sm:px-6 md:px-10 py-6 sm:py-10 flex flex-col min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100vh-60px)]">
      <ProjectsPageHeader title="Pipeline" />

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
        <div className="border border-border bg-bg-secondary p-12 text-center">
          <p className="text-[14px] text-text-secondary">No projects yet.</p>
          <p className="mt-2 text-[11px] uppercase tracking-label text-text-muted">
            Create a project to see it on the pipeline.
          </p>
        </div>
      ) : (
        <div className="flex-1 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 overflow-x-auto pb-4 snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 md:scroll-px-10 overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="flex gap-3 min-w-min h-full pr-1">
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
    </main>
  );
}
