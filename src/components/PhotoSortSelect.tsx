"use client";

import { ArrowUpDown } from "lucide-react";
import {
  PHOTO_SORT_OPTIONS,
  writePhotoSortPreference,
} from "@/lib/photoSortStorage";
import type { PhotoSortMode } from "@/lib/sortPhotos";
import { cn } from "@/lib/utils";

export function PhotoSortSelect({
  value,
  onChange,
  viewStorageId,
  className,
}: {
  value: PhotoSortMode;
  onChange: (mode: PhotoSortMode) => void;
  viewStorageId: string;
  className?: string;
}) {
  function handleChange(next: PhotoSortMode) {
    onChange(next);
    writePhotoSortPreference(viewStorageId, next);
  }

  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-secondary px-2 py-1.5 text-text-muted hover:text-text-secondary transition-colors",
        className
      )}
    >
      <ArrowUpDown className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span className="sr-only">Sort photos by</span>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value as PhotoSortMode)}
        aria-label="Sort photos by"
        className="bg-transparent text-[11px] uppercase tracking-label text-inherit outline-none cursor-pointer max-w-[7.5rem] sm:max-w-none"
      >
        {PHOTO_SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
