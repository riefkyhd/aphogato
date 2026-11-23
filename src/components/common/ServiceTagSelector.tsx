"use client";

import { Camera, Check, Video } from "lucide-react";
import {
  AVAILABLE_SERVICES,
  SERVICE_TAG_LABELS,
  normalizeServices,
} from "@/lib/calendar/serviceTags";
import { cn } from "@/lib/utils";

export function ServiceTagSelector({
  value,
  onChange,
  className,
}: {
  value: string[];
  onChange: (services: string[]) => void;
  className?: string;
}) {
  const current = normalizeServices(value);

  function toggleService(tag: string) {
    if (current.includes(tag)) {
      // Don't allow deselecting all tags - keep at least one
      if (current.length > 1) {
        onChange(current.filter((s) => s !== tag));
      }
    } else {
      onChange([...current, tag]);
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {AVAILABLE_SERVICES.map((tag) => {
        const isSelected = current.includes(tag);
        const label = SERVICE_TAG_LABELS[tag];
        const isPhoto = tag === "photography";

        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleService(tag)}
            aria-pressed={isSelected}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] uppercase tracking-label font-medium transition-all select-none cursor-pointer",
              isSelected
                ? "border-text-primary bg-text-primary text-bg-primary shadow-sm"
                : "border-border bg-bg-surface text-text-muted hover:border-border-strong hover:text-text-primary"
            )}
          >
            {isPhoto ? (
              <Camera className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <Video className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
            <span>{label}</span>
            {isSelected && <Check className="h-3 w-3 shrink-0 ml-0.5" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
