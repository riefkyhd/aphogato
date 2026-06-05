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
      className={cn("inline-flex items-center gap-1", className)}
      role="group"
      aria-label="Photo view"
    >
      <Tooltip label="Grid view">
        <button
          type="button"
          onClick={() => onChange("grid")}
          aria-pressed={view === "grid"}
          aria-label="Grid view"
          className="p-2 transition-colors"
        >
          <LayoutGrid
            className={cn(
              "h-5 w-5",
              view === "grid" ? "text-text-primary" : "text-text-muted"
            )}
            strokeWidth={1.5}
          />
        </button>
      </Tooltip>
      <Tooltip label="List view">
        <button
          type="button"
          onClick={() => onChange("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
          className="p-2 transition-colors"
        >
          <List
            className={cn(
              "h-5 w-5",
              view === "list" ? "text-text-primary" : "text-text-muted"
            )}
            strokeWidth={1.5}
          />
        </button>
      </Tooltip>
    </div>
  );
}
