"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { StatusDot, type ProjectStatus } from "@/components/StatusDot";
import { cn } from "@/lib/utils";
import type { Project, Photo } from "@/lib/types";

export type ProjectCardData = Project & {
  cover?: Pick<Photo, "cloudinary_url"> | null;
  photo_count: number;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const href = `/dashboard/${project.id}`;

  return (
    <Link
      href={href}
      onClick={() => {
        setIsNavigating(true);
        router.refresh();
      }}
      aria-busy={isNavigating}
      aria-label={`Open project ${project.name}`}
      className={cn(
        "group relative block aspect-[3/2] bg-bg-elevated overflow-hidden",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:ring-2 hover:ring-text-primary/25",
        "active:scale-[0.99]",
        isNavigating &&
          "scale-[0.98] ring-2 ring-text-primary shadow-lg pointer-events-none"
      )}
    >
      {project.cover ? (
        <Image
          loader={cloudinaryLoader}
          src={project.cover.cloudinary_url}
          alt={project.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={cn(
            "object-cover transition duration-300",
            isNavigating
              ? "brightness-75 scale-105"
              : "group-hover:brightness-110 group-hover:scale-[1.03]"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-text-muted text-[11px] uppercase tracking-label transition-colors group-hover:text-text-secondary">
          No photos yet
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200",
          isNavigating ? "opacity-90" : "group-hover:from-black/85"
        )}
      />
      <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-200 group-hover:translate-y-[-2px]">
        <div className="text-text-primary text-lg font-light tracking-[0.05em] uppercase leading-tight">
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
