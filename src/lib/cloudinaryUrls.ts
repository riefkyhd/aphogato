/** Shared Cloudinary delivery URL helpers (safe for client + server). */

function cloudinaryTransformUrl(
  src: string,
  params: string
): string {
  if (src.startsWith("http")) {
    return src.replace(
      /\/image\/upload\/(?:[^/]+\/)?/,
      `/image/upload/${params}/`
    );
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/${params}/${src}`;
}

export function masonryImageUrl(src: string, width = 800, quality = 70) {
  return cloudinaryTransformUrl(src, `w_${width},q_${quality},f_auto`);
}

/** Client gallery grid — width cap, natural aspect ratio (no crop). */
export function galleryGridImageUrl(src: string, width = 900) {
  return cloudinaryTransformUrl(src, `w_${width},c_limit,q_auto,f_auto`);
}

/** Target delivery width per masonry column count (viewport-aware grid). */
export function galleryGridWidthForColumns(columns: number): number {
  if (columns <= 1) return 540;
  if (columns === 2) return 480;
  if (columns === 3) return 420;
  return 380;
}

export function galleryGridSrcSet(src: string, baseWidth: number): string {
  const widths = Array.from(
    new Set([baseWidth, Math.min(baseWidth * 2, 900)])
  ).sort((a, b) => a - b);
  return widths.map((w) => `${galleryGridImageUrl(src, w)} ${w}w`).join(", ");
}

export function galleryGridSizes(columnCount: number): string {
  if (columnCount >= 4) {
    return "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";
  }
  if (columnCount === 3) {
    return "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";
  }
  if (columnCount === 2) {
    return "(min-width: 480px) 50vw, 100vw";
  }
  return "100vw";
}

/** Face indexing — high-res JPEG for detection + embedding quality. */
export function faceIndexImageUrl(src: string, width = 2048) {
  return cloudinaryTransformUrl(src, `w_${width},c_limit,q_auto,f_jpg`);
}

export function listThumbUrl(src: string) {
  return cloudinaryTransformUrl(src, "w_120,h_120,c_fill,q_60,f_auto");
}

export function previewLargeUrl(src: string) {
  return cloudinaryTransformUrl(src, "w_1400,q_85,f_auto");
}
