import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { publicIdFromUrl } from "@/lib/cloudinary";

function normalizeFolderInput(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, "");
}

function filenameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return filename;
  return filename.slice(0, lastDot);
}

export function getCloudinaryUploadCredentials() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary env vars (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
    );
  }
  return { cloudName, apiKey, apiSecret };
}

export function buildSignedCloudinaryUpload(
  folder: string,
  originalFilename: string
): {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  assetFolder: string;
  uploadUrl: string;
} {
  const { cloudName, apiKey, apiSecret } = getCloudinaryUploadCredentials();
  const normalizedFolder = normalizeFolderInput(folder);
  const baseName = filenameWithoutExtension(originalFilename);
  if (!normalizedFolder || !baseName) {
    throw new Error("Invalid upload folder or filename");
  }

  const publicId = `${normalizedFolder}/${baseName}`;
  const timestamp = Math.round(Date.now() / 1000);

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      public_id: publicId,
      asset_folder: normalizedFolder,
      overwrite: false,
    },
    apiSecret
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    publicId,
    assetFolder: normalizedFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

export function cloudinaryResourceFilename(
  publicId: string,
  format?: string | null
): string {
  const parts = publicId.split("/");
  const stem = parts[parts.length - 1] ?? publicId;
  return `${stem}.${format ?? "jpg"}`;
}

export function isCloudinaryUrlForPublicId(
  secureUrl: string,
  publicId: string
): boolean {
  const { cloudName } = getCloudinaryUploadCredentials();
  if (!secureUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
    return false;
  }
  return publicIdFromUrl(secureUrl) === publicId;
}
