"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import {
  PhotoUploadProgress,
  overallUploadPercent,
  type UploadProgressState,
} from "@/components/PhotoUploadProgress";

export function UploadProgressDock({
  progress,
  onCancel,
}: {
  progress: UploadProgressState;
  onCancel: () => void;
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
          "fixed z-[101] border border-border bg-bg-elevated shadow-2xl transition-all duration-200",
          expanded
            ? "bottom-6 right-6 left-6 sm:left-auto sm:w-[min(440px,calc(100vw-3rem))] rounded-lg px-5 py-5"
            : "bottom-6 right-6 w-[min(380px,calc(100vw-2rem))] rounded-lg px-5 py-4"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <span className="text-[13px] font-medium uppercase tracking-label text-text-primary truncate">
              Uploading {progress.currentIndex} of {progress.total}
              {progress.queuedBatches
                ? ` · +${progress.queuedBatches} batch${progress.queuedBatches === 1 ? "" : "es"}`
                : ""}
            </span>
            <span className="shrink-0 text-[13px] tabular-nums text-text-secondary">
              {overall}%
            </span>
            {expanded ? (
              <ChevronDown className="h-5 w-5 shrink-0 text-text-muted" />
            ) : (
              <ChevronUp className="h-5 w-5 shrink-0 text-text-muted" />
            )}
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="px-2.5 py-1.5 text-[11px] uppercase tracking-label text-status-editing hover:text-text-primary rounded-sm hover:bg-bg-primary/60 transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
            {expanded && (
              <Tooltip label="Close upload details">
                <button
                  type="button"
                  className="p-2 text-text-muted hover:text-text-primary rounded-sm hover:bg-bg-primary/60 transition-colors"
                  aria-label="Close upload details"
                  onClick={() => setExpanded(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {!expanded && (
          <div className="mt-4 space-y-3">
            <div className="h-2 w-full bg-bg-primary overflow-hidden rounded-sm">
              <div
                className="h-full bg-text-primary transition-[width] duration-150"
                style={{ width: `${overall}%` }}
              />
            </div>
            <p className="text-[13px] text-text-secondary truncate leading-snug">
              {progress.fileName}
              <span className="text-text-muted ml-2 tabular-nums">
                {progress.preparing
                  ? "compressing…"
                  : progress.indexingFaces
                    ? "indexing faces…"
                    : `${progress.filePercent}%`}
              </span>
            </p>
          </div>
        )}

        {expanded && (
          <div className="mt-5">
            <PhotoUploadProgress
              progress={progress}
              className="border-0 bg-transparent p-0"
              variant="dock"
            />
          </div>
        )}
      </div>
    </>
  );
}
