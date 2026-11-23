"use client";

import { Camera, Video } from "lucide-react";
import {
  SERVICE_TAG_LABELS,
  normalizeServices,
} from "@/lib/calendar/serviceTags";
import { cn } from "@/lib/utils";

export function ServiceBadges({
  services,
  className,
  showIcons = true,
  size = "sm",
}: {
  services?: string[] | null;
  className?: string;
  showIcons?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const normalized = normalizeServices(services);

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 gap-1",
    sm: "text-[10px] px-2 py-0.5 gap-1.5",
    md: "text-[11px] px-2.5 py-1 gap-1.5",
  }[size];

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  }[size];

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {normalized.map((tag) => {
        const label = SERVICE_TAG_LABELS[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
        const isPhoto = tag === "photography";
        const isVideo = tag === "videography";

        return (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center rounded-sm border border-border bg-bg-surface/60 font-medium uppercase tracking-label text-text-secondary select-none",
              sizeClasses
            )}
          >
            {showIcons && (
              isPhoto ? (
                <Camera className={cn("shrink-0 text-text-muted", iconSizes)} aria-hidden />
              ) : isVideo ? (
                <Video className={cn("shrink-0 text-text-muted", iconSizes)} aria-hidden />
              ) : null
            )}
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}
