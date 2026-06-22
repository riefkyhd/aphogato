"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function FaceFindControls({
  active,
  facePickMode,
  matchCount,
  matching,
  disabled,
  onStartPick,
  onClearFilter,
  onCancelPick,
}: {
  active: boolean;
  facePickMode: boolean;
  matchCount: number | null;
  matching: boolean;
  disabled?: boolean;
  onStartPick: () => void;
  onClearFilter: () => void;
  onCancelPick: () => void;
}) {
  if (!active) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {matchCount !== null ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-sm border border-border bg-bg-elevated px-3 py-1.5 text-[11px] uppercase tracking-label text-text-primary">
            {matchCount} photo{matchCount === 1 ? "" : "s"} with this face
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={onClearFilter}
          >
            Clear filter
          </Button>
        </div>
      ) : facePickMode ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-label text-text-secondary">
            Tap a photo that shows your face
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || matching}
            onClick={onCancelPick}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn("shrink-0")}
          disabled={disabled || matching}
          onClick={onStartPick}
        >
          Find my photos
        </Button>
      )}
    </div>
  );
}
