"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ProjectCoverImage } from "@/components/projects/ProjectCoverImage";
import { StatusDot, type ProjectStatus } from "@/components/StatusDot";
import { cn } from "@/lib/utils";
import type { Project, Photo } from "@/lib/types";

export type ProjectCardData = Project & {
  cover?: Pick<Photo, "cloudinary_url"> | null;
  photo_count: number;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const href = `/dashboard/${project.id}`;

  return (
    <Link
      href={href}
      onClick={() => setIsNavigating(true)}
      aria-busy={isNavigating}
      aria-label={`Open project ${project.name}`}
      className={cn(
        "group relative block aspect-[5/3] min-[480px]:aspect-[3/2] bg-bg-elevated overflow-hidden",
        isNavigating && "pointer-events-none ring-2 ring-text-primary"
      )}
    >
      {project.cover ? (
        <div className="absolute inset-0 overflow-hidden">
          <ProjectCoverImage
            src={project.cover.cloudinary_url}
            alt=""
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "transition-transform duration-500 ease-out",
              isNavigating
                ? "scale-105 brightness-75"
                : "group-hover:scale-110 group-hover:brightness-110"
            )}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-[11px] uppercase tracking-label transition-colors group-hover:text-text-secondary">
          No photos yet
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200 pointer-events-none",
          isNavigating ? "opacity-90" : "group-hover:from-black/85"
        )}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 pointer-events-none">
        <div className="text-text-primary text-base sm:text-lg font-light tracking-[0.05em] uppercase leading-tight line-clamp-2">
          {project.name}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
            {project.client_name ?? "—"}
          </span>
          <StatusDot status={(project.status as ProjectStatus) ?? "pending"} />
        </div>
      </div>

      {isNavigating && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-[1px]">
          <Loader2
            className="h-8 w-8 animate-spin text-text-primary"
            aria-hidden
          />
          <span className="text-[11px] uppercase tracking-label text-text-primary">
            Opening…
          </span>
        </div>
      )}
    </Link>
  );
}
