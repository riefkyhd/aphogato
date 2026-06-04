"use client";

import { ImagePlus } from "lucide-react";

/** Lightweight drag-over hint (no upload progress). */
export function PhotoDropHint() {
  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      role="region"
      aria-label="Drop photos to upload"
    >
      <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-[1px]" />
      <div className="absolute inset-4 md:inset-8 flex items-center justify-center rounded-lg border-2 border-dashed border-text-primary/60">
        <div className="text-center px-6">
          <ImagePlus
            className="mx-auto h-12 w-12 text-text-primary mb-4"
            strokeWidth={1.25}
          />
          <p className="text-lg font-light tracking-[0.04em] text-text-primary">
            Drop photos to upload
          </p>
        </div>
      </div>
    </div>
  );
}
