"use client";

import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import {
  BOARD_COLUMNS,
  type BoardProject,
} from "@/lib/projects/board";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectBoardCard({
  project,
  onStatusChange,
  moving,
}: {
  project: BoardProject;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  moving: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setCanDrag(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <article
      draggable={canDrag && !moving}
      onDragStart={(e) => {
        setDragging(true);
        e.dataTransfer.setData("text/project-id", project.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "border border-border bg-bg-secondary transition-opacity",
        dragging && "opacity-40",
        moving && "opacity-60 pointer-events-none"
      )}
    >
      <Link
        href={`/dashboard/${project.id}`}
        className="block p-3 hover:bg-bg-elevated/60 transition-colors"
        onClick={(e) => {
          if (dragging) e.preventDefault();
        }}
      >
        <div className="flex gap-3">
          <div className="relative h-14 w-20 shrink-0 bg-bg-elevated overflow-hidden">
            {project.cover_url ? (
              <Image
                loader={cloudinaryLoader}
                src={project.cover_url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-label text-text-muted text-center px-1">
                No photos
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-text-primary font-medium leading-snug line-clamp-2">
              {project.name}
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary truncate">
              {project.client_name ?? "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-label text-text-muted">
              <span>{project.photo_count} photos</span>
              {project.deliverables_total > 0 && (
                <span>
                  {project.deliverables_done}/{project.deliverables_total}{" "}
                  deliverables
                </span>
              )}
              {project.next_shoot_date && (
                <span>
                  {format(parseISO(project.next_shoot_date), "MMM d")}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="border-t border-border/60 px-3 py-2.5 flex items-center gap-2">
        <label
          htmlFor={`board-move-${project.id}`}
          className="text-[10px] uppercase tracking-label text-text-muted shrink-0"
        >
          Stage
        </label>
        <select
          id={`board-move-${project.id}`}
          aria-label={`Move ${project.name} to another stage`}
          value={project.status}
          disabled={moving}
          className="input-dark select-compact flex-1 min-w-0 text-[11px] uppercase tracking-label"
          onChange={(e) => {
            const next = e.target.value as ProjectStatus;
            if (next !== project.status) {
              onStatusChange(project.id, next);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {BOARD_COLUMNS.map((col) => (
            <option key={col.status} value={col.status}>
              {col.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}
