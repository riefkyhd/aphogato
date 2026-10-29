/**
 * Unified delivery URL helpers — Cloudinary upload URLs and ImageKit URLs.
 */

import {
  faceIndexImageUrl as cloudinaryFaceIndexUrl,
  galleryGridImageUrl as cloudinaryGalleryGridUrl,
  galleryGridSrcSet as cloudinaryGalleryGridSrcSet,
  listThumbUrl as cloudinaryListThumbUrl,
  masonryImageUrl as cloudinaryMasonryImageUrl,
  previewLargeUrl as cloudinaryPreviewLargeUrl,
  socialShareImageUrl as cloudinarySocialShareUrl,
} from "@/lib/cloudinaryUrls";
export {
  galleryGridSizes,
  galleryGridWidthForColumns,
} from "@/lib/cloudinaryUrls";
import {
  imageKitFaceIndexUrl,
  imageKitGalleryGridUrl,
  imageKitGallerySrcSet,
  imageKitListThumbUrl,
  imageKitMasonryUrl,
  imageKitPreviewLargeUrl,
  imageKitSocialShareUrl,
  isImageKitUrl,
} from "@/lib/imagekitUrls";
import {
  gdriveFaceIndexUrl,
  gdriveGalleryGridUrl,
  gdriveGallerySrcSet,
  gdriveListThumbUrl,
  gdriveMasonryUrl,
  gdrivePreviewLargeUrl,
  gdriveSocialShareUrl,
  isGDriveUrl,
} from "@/lib/gdriveUrls";

export { isImageKitUrl, isGDriveUrl };

export function masonryImageUrl(src: string, width = 800, quality = 70) {
  if (isGDriveUrl(src)) return gdriveMasonryUrl(src, width);
  return isImageKitUrl(src)
    ? imageKitMasonryUrl(src, width, quality)
    : cloudinaryMasonryImageUrl(src, width, quality);
}

export function galleryGridImageUrl(src: string, width = 900) {
  if (isGDriveUrl(src)) return gdriveGalleryGridUrl(src, width);
  return isImageKitUrl(src)
    ? imageKitGalleryGridUrl(src, width)
    : cloudinaryGalleryGridUrl(src, width);
}

export function galleryGridSrcSet(src: string, baseWidth: number) {
  if (isGDriveUrl(src)) return gdriveGallerySrcSet(src, baseWidth);
  return isImageKitUrl(src)
    ? imageKitGallerySrcSet(src, baseWidth)
    : cloudinaryGalleryGridSrcSet(src, baseWidth);
}

export function faceIndexImageUrl(src: string, width = 2048) {
  if (isGDriveUrl(src)) return gdriveFaceIndexUrl(src, width);
  return isImageKitUrl(src)
    ? imageKitFaceIndexUrl(src, width)
    : cloudinaryFaceIndexUrl(src, width);
}

export function listThumbUrl(src: string) {
  if (isGDriveUrl(src)) return gdriveListThumbUrl(src);
  return isImageKitUrl(src)
    ? imageKitListThumbUrl(src)
    : cloudinaryListThumbUrl(src);
}

export function previewLargeUrl(src: string) {
  if (isGDriveUrl(src)) return gdrivePreviewLargeUrl(src);
  return isImageKitUrl(src)
    ? imageKitPreviewLargeUrl(src)
    : cloudinaryPreviewLargeUrl(src);
}

export function socialShareImageUrl(src: string) {
  if (isGDriveUrl(src)) return gdriveSocialShareUrl(src);
  return isImageKitUrl(src)
    ? imageKitSocialShareUrl(src)
    : cloudinarySocialShareUrl(src);
}
