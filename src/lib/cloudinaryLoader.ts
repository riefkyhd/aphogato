"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Next.js image loader for Cloudinary URLs. Accepts a full Cloudinary URL or
 * a public_id; injects/replaces the transformation segment with width-aware
 * q_auto,f_auto delivery params.
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  const q = quality ?? "auto";
  const params = `w_${width},q_${q},f_auto`;

  if (src.startsWith("http")) {
    return src.replace(
      /\/image\/upload\/(?:[^/]+\/)?/,
      `/image/upload/${params}/`
    );
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/${params}/${src}`;
}
