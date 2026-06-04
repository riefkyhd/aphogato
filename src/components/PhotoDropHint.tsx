"use client";

import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Full-screen Google Drive–style drop welcome overlay. */
export function PhotoDropHint({
  projectName,
  fileCount = null,
}: {
  projectName?: string;
  fileCount?: number | null;
}) {
  const countLabel =
    fileCount === 1
      ? "1 photo ready"
      : fileCount && fileCount > 1
        ? `${fileCount} photos ready`
        : null;

  return (
    <div
      className="photo-drop-overlay fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-10 pointer-events-none"
      role="region"
      aria-label="Drop photos to upload"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-bg-primary/75 backdrop-blur-sm" />

      <div
        className={cn(
          "photo-drop-panel relative w-full max-w-lg rounded-lg border-2 border-dashed",
          "border-text-primary/70 bg-bg-elevated/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
          "px-8 py-10 md:px-12 md:py-14 text-center"
        )}
      >
        <div className="photo-drop-icon-wrap mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-bg-primary">
          <ImagePlus
            className="h-10 w-10 text-text-primary"
            strokeWidth={1.25}
            aria-hidden
          />
        </div>

        <p className="text-xl md:text-2xl font-light tracking-[0.04em] text-text-primary">
          Drop photos to upload
        </p>

        <p className="mt-3 text-[14px] text-text-secondary leading-relaxed max-w-sm mx-auto">
          {projectName
            ? `Release to add them to ${projectName}`
            : "Release to add them to this project"}
        </p>

        {countLabel && (
          <p className="mt-5 inline-block rounded-sm border border-border bg-bg-primary px-4 py-2 text-[11px] uppercase tracking-label text-text-primary">
            {countLabel}
          </p>
        )}
      </div>
    </div>
  );
}
