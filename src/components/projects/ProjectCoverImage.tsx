"use client";

import { useState } from "react";
import { useReportMediaLoadFailure } from "@/components/media/MediaLoadStatus";
import { MEDIA_UNAVAILABLE_COVER_LABEL } from "@/lib/cloudinary/accountStatus";
import { listThumbUrl, masonryImageUrl } from "@/lib/mediaUrls";
import { cn } from "@/lib/utils";

type ProjectCoverImageProps = {
  src: string;
  alt?: string;
  sizes?: string;
  className?: string;
  /** Compact thumb (pipeline board) vs full card cover. */
  variant?: "card" | "thumb";
};

/**
 * Project cover with multi-provider URL resolution and load-error handling.
 */
export function ProjectCoverImage({
  src,
  alt = "",
  className,
  variant = "card",
}: ProjectCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const reportFailure = useReportMediaLoadFailure();

  if (failed) {
    return (
      <div
        className={cn(
          "absolute inset-0 z-[1] flex items-center justify-center bg-bg-elevated px-3",
          className
        )}
        role="img"
        aria-label={MEDIA_UNAVAILABLE_COVER_LABEL}
      >
        <p
          className={cn(
            "text-center uppercase tracking-label text-text-secondary leading-relaxed",
            variant === "thumb" ? "text-[9px]" : "text-[11px]"
          )}
        >
          {variant === "thumb" ? "Unavailable" : MEDIA_UNAVAILABLE_COVER_LABEL}
        </p>
      </div>
    );
  }

  const resolvedUrl =
    variant === "thumb"
      ? listThumbUrl(src)
      : masonryImageUrl(src, 800, 75);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      onError={() => {
        setFailed(true);
        reportFailure?.();
      }}
    />
  );
}
