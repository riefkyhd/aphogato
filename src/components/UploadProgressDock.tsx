"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PhotoUploadProgress,
  overallUploadPercent,
  type UploadProgressState,
} from "@/components/PhotoUploadProgress";

export function UploadProgressDock({
  progress,
}: {
  progress: UploadProgressState;
}) {
  const [expanded, setExpanded] = useState(false);
  const overall = overallUploadPercent(progress);

  return (
    <>
      {expanded && (
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-bg-primary/50 backdrop-blur-[1px]"
          aria-label="Close upload details"
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className={cn(
          "fixed z-[101] border border-border bg-bg-elevated shadow-lg transition-all duration-200",
          expanded
            ? "bottom-6 right-6 left-6 sm:left-auto sm:w-[400px] rounded-lg p-4"
            : "bottom-4 right-4 w-[min(320px,calc(100vw-2rem))] rounded-md"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left p-2 -m-2"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="text-[11px] uppercase tracking-label text-text-primary truncate">
              Uploading {progress.currentIndex} of {progress.total}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-text-secondary">
              {overall}%
            </span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
            ) : (
              <ChevronUp className="h-4 w-4 shrink-0 text-text-muted" />
            )}
          </button>
          {expanded && (
            <button
              type="button"
              className="p-1.5 text-text-muted hover:text-text-primary"
              aria-label="Close upload details"
              onClick={() => setExpanded(false)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!expanded && (
          <div className="px-2 pb-2">
            <div className="h-1 w-full bg-bg-primary overflow-hidden">
              <div
                className="h-full bg-text-primary transition-[width] duration-150"
                style={{ width: `${overall}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-text-muted truncate">
              {progress.fileName}
            </p>
          </div>
        )}

        {expanded && (
          <div className="mt-3">
            <PhotoUploadProgress progress={progress} className="border-0 p-0" />
          </div>
        )}
      </div>
    </>
  );
}
