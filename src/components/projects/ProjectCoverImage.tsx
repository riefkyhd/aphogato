"use client";

import Image from "next/image";
import { useState } from "react";
import { useReportMediaLoadFailure } from "@/components/media/MediaLoadStatus";
import { cloudinaryLoader } from "@/lib/cloudinaryLoader";
import { MEDIA_UNAVAILABLE_COVER_LABEL } from "@/lib/cloudinary/accountStatus";
import { cn } from "@/lib/utils";

type ProjectCoverImageProps = {
  src: string;
  alt?: string;
  sizes: string;
  className?: string;
  /** Compact thumb (pipeline board) vs full card cover. */
  variant?: "card" | "thumb";
};

/**
 * Project cover with load-error handling — avoids native broken-image icons.
 */
export function ProjectCoverImage({
  src,
  alt = "",
  sizes,
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

  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      draggable={false}
      className={cn("object-cover", className)}
      onError={() => {
        setFailed(true);
        reportFailure?.();
      }}
    />
  );
}
