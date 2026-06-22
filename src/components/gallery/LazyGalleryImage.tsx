"use client";

import { useIntersectionOnce } from "@/hooks/useIntersectionOnce";
import { cn } from "@/lib/utils";

/** Loads image src only when the cell is near the viewport. */
export function LazyGalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const { ref, visible: shouldLoad } = useIntersectionOnce({
    rootMargin: "500px 0px",
  });

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full bg-bg-elevated",
        !shouldLoad && "min-h-[120px] sm:min-h-[140px]"
      )}
    >
      {shouldLoad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn("block w-full h-auto", className)}
          decoding="async"
          draggable={false}
        />
      ) : null}
    </div>
  );
}
