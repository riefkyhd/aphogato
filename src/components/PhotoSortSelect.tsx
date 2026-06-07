"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  directionLabel,
  PHOTO_SORT_OPTIONS,
  writePhotoSortPreference,
  type PhotoSortPreference,
} from "@/lib/photoSortStorage";
import {
  DEFAULT_SORT_DIRECTION,
  type PhotoSortDirection,
  type PhotoSortMode,
} from "@/lib/sortPhotos";
import { cn } from "@/lib/utils";

export function PhotoSortSelect({
  preference,
  onChange,
  viewStorageId,
  className,
}: {
  preference: PhotoSortPreference;
  onChange: (pref: PhotoSortPreference) => void;
  viewStorageId: string;
  className?: string;
}) {
  const { mode, directions } = preference;
  const direction = directions[mode] ?? DEFAULT_SORT_DIRECTION[mode];

  function persist(next: PhotoSortPreference) {
    onChange(next);
    writePhotoSortPreference(viewStorageId, next);
  }

  function handleModeChange(nextMode: PhotoSortMode) {
    persist({
      mode: nextMode,
      directions: {
        ...directions,
        [nextMode]: directions[nextMode] ?? DEFAULT_SORT_DIRECTION[nextMode],
      },
    });
  }

  function toggleDirection() {
    const nextDirection: PhotoSortDirection = direction === "asc" ? "desc" : "asc";
    persist({
      mode,
      directions: {
        ...directions,
        [mode]: nextDirection,
      },
    });
  }

  const directionHint = directionLabel(mode, direction);

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-stretch rounded-sm border border-border overflow-hidden bg-bg-secondary sm:inline-flex sm:w-auto",
        className
      )}
    >
      <label className="inline-flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-2 text-text-muted hover:text-text-secondary transition-colors sm:flex-none">
        <ArrowUpDown className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <span className="sr-only">Sort photos by</span>
        <select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value as PhotoSortMode)}
          aria-label="Sort photos by"
          className="min-w-0 flex-1 bg-transparent text-[11px] uppercase tracking-label text-inherit outline-none cursor-pointer sm:flex-none sm:max-w-none"
        >
          {PHOTO_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <Tooltip label={directionHint}>
        <button
          type="button"
          onClick={toggleDirection}
          aria-label={`${directionHint}. Click to reverse sort order.`}
          className="inline-flex items-center justify-center border-l border-border px-2.5 py-2 text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
        >
          {direction === "asc" ? (
            <ArrowUp className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          ) : (
            <ArrowDown className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
