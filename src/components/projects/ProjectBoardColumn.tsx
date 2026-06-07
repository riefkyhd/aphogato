"use client";

import { ProjectBoardCard } from "@/components/projects/ProjectBoardCard";
import type { BoardProject } from "@/lib/projects/board";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectBoardColumn({
  status,
  label,
  hint,
  projects,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onStatusChange,
  movingId,
}: {
  status: ProjectStatus;
  label: string;
  hint: string;
  projects: BoardProject[];
  dragOver: boolean;
  onDragOver: (status: ProjectStatus) => void;
  onDragLeave: () => void;
  onDrop: (status: ProjectStatus, projectId: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  movingId: string | null;
}) {
  return (
    <section
      className={cn(
        "flex w-[min(85vw,300px)] sm:w-[272px] shrink-0 flex-col",
        "snap-center snap-always",
        "max-h-[calc(100dvh-11rem)] sm:max-h-[calc(100dvh-12rem)] md:max-h-[calc(100vh-13rem)]",
        "border border-border bg-bg-primary/40"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(status);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const projectId = e.dataTransfer.getData("text/project-id");
        if (projectId) onDrop(status, projectId);
      }}
    >
      <header
        className={cn(
          "shrink-0 border-b border-border px-3 py-3 transition-colors",
          dragOver && "bg-bg-elevated border-text-primary/30"
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[11px] uppercase tracking-label text-text-primary">
            {label}
          </h2>
          <span className="text-[11px] tabular-nums text-text-muted">
            {projects.length}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-text-muted leading-relaxed line-clamp-2">
          {hint}
        </p>
      </header>
      <ul className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[4rem]">
        {projects.length === 0 ? (
          <li className="px-2 py-6 text-center text-[11px] text-text-muted">
            <span className="hidden sm:inline">Drop a project here</span>
            <span className="sm:hidden">No projects in this stage</span>
          </li>
        ) : (
          projects.map((project) => (
            <li key={project.id}>
              <ProjectBoardCard
                project={project}
                onStatusChange={onStatusChange}
                moving={movingId === project.id}
              />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
