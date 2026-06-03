import { cn } from "@/lib/utils";
import { masonryImageUrl } from "@/lib/cloudinaryUrls";

type MasonryPhotoProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Full-width image at natural aspect ratio for masonry columns. */
export function MasonryPhoto({ src, alt, className }: MasonryPhotoProps) {
  return (
    // Native img preserves intrinsic dimensions (width 100%, height auto).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={masonryImageUrl(src)}
      alt={alt}
      className={cn("block w-full h-auto bg-bg-elevated", className)}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
