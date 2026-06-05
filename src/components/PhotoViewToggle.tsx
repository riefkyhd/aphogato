"use client";

import { LayoutGrid, List } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import type { PhotoViewMode } from "@/lib/photoViewStorage";

export function PhotoViewToggle({
  view,
  onChange,
  className,
}: {
  view: PhotoViewMode;
  onChange: (mode: PhotoViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-sm border border-border overflow-hidden",
        className
      )}
      role="group"
      aria-label="Photo view"
    >
      <Tooltip label="Grid view">
        <button
          type="button"
          onClick={() => onChange("grid")}
          aria-pressed={view === "grid"}
          aria-label="Grid view"
          className={cn(
            "p-2 transition-colors",
            view === "grid"
              ? "bg-bg-elevated text-text-primary"
              : "bg-bg-secondary text-text-muted hover:text-text-secondary"
          )}
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </button>
      </Tooltip>
      <Tooltip label="List view">
        <button
          type="button"
          onClick={() => onChange("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
          className={cn(
            "p-2 transition-colors",
            view === "list"
              ? "bg-bg-elevated text-text-primary"
              : "bg-bg-secondary text-text-muted hover:text-text-secondary"
          )}
        >
          <List className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </button>
      </Tooltip>
    </div>
  );
}
