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
export function galleryGridImageUrl(src: string) {
  return cloudinaryTransformUrl(src, "w_900,c_limit,q_75,f_auto");
}

export function listThumbUrl(src: string) {
  return cloudinaryTransformUrl(src, "w_120,h_120,c_fill,q_60,f_auto");
}

export function previewLargeUrl(src: string) {
  return cloudinaryTransformUrl(src, "w_1400,q_85,f_auto");
}
