/** ImageKit delivery URL transforms (client + server safe). */

import { getImageKitUrlEndpoint } from "@/lib/imagekit/publicConfig";

export function isImageKitUrl(src: string): boolean {
  if (!src.startsWith("http")) return false;
  const endpoint = getImageKitUrlEndpoint();
  if (endpoint && src.startsWith(endpoint)) return true;
  return /https:\/\/ik\.imagekit\.io\//i.test(src);
}

function imageKitEndpointForUrl(src: string): string | null {
  const configured = getImageKitUrlEndpoint();
  if (configured && src.startsWith(configured)) return configured;

  const match = src.match(/^(https:\/\/ik\.imagekit\.io\/[^/]+)/i);
  return match?.[1] ?? null;
}

/** Insert or replace `tr:` transformation segment in an ImageKit URL. */
export function imageKitTransformUrl(src: string, transform: string): string {
  const endpoint = imageKitEndpointForUrl(src);
  if (!endpoint) return src;

  const relative = src.slice(endpoint.length).replace(/^\//, "");
  const withoutTransform = relative.replace(/^tr:[^/]+\//, "");
  return `${endpoint}/tr:${transform}/${withoutTransform}`;
}

export function imageKitMasonryUrl(src: string, width = 800, quality = 70) {
  return imageKitTransformUrl(src, `w-${width},q-${quality},f-auto`);
}

export function imageKitGalleryGridUrl(src: string, width = 900) {
  return imageKitTransformUrl(src, `w-${width},c-at_max,q-auto,f-auto`);
}

export function imageKitListThumbUrl(src: string) {
  return imageKitTransformUrl(src, "w-120,h-120,c-at_max,q-60,f-auto");
}

export function imageKitPreviewLargeUrl(src: string) {
  return imageKitTransformUrl(src, "w-1400,q-85,f-auto");
}

export function imageKitFaceIndexUrl(src: string, width = 2048) {
  return imageKitTransformUrl(src, `w-${width},c-at_max,q-auto,f-jpg`);
}

export function imageKitSocialShareUrl(src: string) {
  return imageKitTransformUrl(src, "w-1200,h-630,c-at_max,q-auto,f-auto");
}

export function imageKitGallerySrcSet(src: string, baseWidth: number): string {
  const widths = Array.from(
    new Set([baseWidth, Math.min(baseWidth * 2, 900)])
  ).sort((a, b) => a - b);
  return widths
    .map((w) => `${imageKitGalleryGridUrl(src, w)} ${w}w`)
    .join(", ");
}
