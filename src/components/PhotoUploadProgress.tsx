"use client";

import { cn } from "@/lib/utils";

export type UploadProgressState = {
  currentIndex: number;
  total: number;
  fileName: string;
  filePercent: number;
  preparing?: boolean;
  queuedBatches?: number;
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
  variant = "default",
}: {
  progress: UploadProgressState;
  className?: string;
  variant?: "default" | "dock";
}) {
  const overall = overallUploadPercent(progress);
  const isDock = variant === "dock";

  return (
    <div
      className={cn(
        "rounded border border-border bg-bg-elevated text-[13px]",
        isDock ? "px-0 py-0" : "px-5 py-4",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4",
          isDock ? "mb-4" : "mb-3"
        )}
      >
        <span
          className={cn(
            "text-text-primary uppercase tracking-label font-medium",
            isDock ? "text-[13px]" : "text-[12px]"
          )}
        >
          Uploading {progress.currentIndex} of {progress.total}
        </span>
        <span className="text-text-secondary tabular-nums text-[13px]">
          {overall}%
        </span>
      </div>
      <p
        className={cn(
          "text-text-secondary truncate leading-snug",
          isDock ? "mb-4 text-[14px]" : "mb-4 text-[13px]"
        )}
        title={progress.fileName}
      >
        {progress.fileName}
        <span className="text-text-muted ml-2 tabular-nums">
          {progress.preparing ? "(compressing…)" : `(${progress.filePercent}%)`}
        </span>
      </p>
      <div
        className={cn(
          "w-full bg-bg-primary overflow-hidden rounded-sm",
          isDock ? "h-2" : "h-1.5"
        )}
      >
        <div
          className="h-full bg-text-primary transition-[width] duration-150 ease-out"
          style={{ width: `${overall}%` }}
        />
      </div>
    </div>
  );
}
