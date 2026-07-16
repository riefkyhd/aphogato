"use client";

import { useState } from "react";
import { MediaUnavailableCell } from "@/components/media/MediaUnavailable";
import { useReportMediaLoadFailure } from "@/components/media/MediaLoadStatus";
import { MEDIA_UNAVAILABLE_CELL_LABEL } from "@/lib/cloudinary/accountStatus";
import { cn } from "@/lib/utils";
import {
  galleryGridImageUrl,
  galleryGridSizes,
  galleryGridSrcSet,
  galleryGridWidthForColumns,
  masonryImageUrl,
} from "@/lib/mediaUrls";

type MasonryPhotoProps = {
  src: string;
  alt: string;
  className?: string;
  variant?: "dashboard" | "gallery";
  /** Masonry column count — used for responsive gallery delivery widths. */
  galleryColumnCount?: number;
};

/** Full-width image at natural aspect ratio for masonry columns. */
export function MasonryPhoto({
  src,
  alt,
  className,
  variant = "dashboard",
  galleryColumnCount = 2,
}: MasonryPhotoProps) {
  const [failed, setFailed] = useState(false);
  const reportFailure = useReportMediaLoadFailure();

  function handleError() {
    if (failed) return;
    setFailed(true);
    reportFailure?.();
  }

  if (failed) {
    return (
      <MediaUnavailableCell
        label={MEDIA_UNAVAILABLE_CELL_LABEL}
        className={className}
      />
    );
  }

  if (variant === "gallery") {
    const width = galleryGridWidthForColumns(galleryColumnCount);
    const url = galleryGridImageUrl(src, width);
    const srcSet = galleryGridSrcSet(src, width);
    const sizes = galleryGridSizes(galleryColumnCount);

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={cn("block w-full h-auto bg-bg-elevated", className)}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={handleError}
      />
    );
  }

  const url = masonryImageUrl(src);

  return (
    // Native img preserves intrinsic dimensions (width 100%, height auto).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn("block w-full h-auto bg-bg-elevated", className)}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={handleError}
    />
  );
}
