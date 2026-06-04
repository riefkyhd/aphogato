"use client";

import { cn } from "@/lib/utils";

export type UploadProgressState = {
  currentIndex: number;
  total: number;
  fileName: string;
  filePercent: number;
};

export function overallUploadPercent(state: UploadProgressState): number {
  if (state.total === 0) return 0;
  const completed = state.currentIndex - 1;
  const current = state.filePercent / 100;
  return Math.round(((completed + current) / state.total) * 100);
}

export function PhotoUploadProgress({
  progress,
  className,
}: {
  progress: UploadProgressState;
  className?: string;
}) {
  const overall = overallUploadPercent(progress);

  return (
    <div
      className={cn(
        "rounded border border-border bg-bg-elevated px-4 py-3 text-[12px]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-text-primary uppercase tracking-label text-[11px]">
          Uploading {progress.currentIndex} of {progress.total}
        </span>
        <span className="text-text-secondary tabular-nums">{overall}%</span>
      </div>
      <p className="text-text-secondary truncate mb-3" title={progress.fileName}>
        {progress.fileName}
        <span className="text-text-muted ml-2 tabular-nums">
          ({progress.filePercent}%)
        </span>
      </p>
      <div className="h-1 w-full bg-bg-primary overflow-hidden">
        <div
          className="h-full bg-text-primary transition-[width] duration-150 ease-out"
          style={{ width: `${overall}%` }}
        />
      </div>
    </div>
  );
}
