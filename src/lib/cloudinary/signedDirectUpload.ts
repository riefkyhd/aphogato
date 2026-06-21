import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { publicIdFromUrl } from "@/lib/cloudinary";
import { getCloudinaryAccount } from "@/lib/cloudinary/accounts";
import { sanitizeCloudinaryBasename } from "@/lib/cloudinary/filenames";

export {
  buildPhotoFilename,
  cloudinaryResourceFilename,
  filenameWithoutExtension,
  publicIdBelongsToAssetFolder,
  resolveStoredUploadFilename,
  sanitizeCloudinaryBasename,
} from "@/lib/cloudinary/filenames";

function normalizeFolderInput(folder: string): string {
  return folder.trim().replace(/^\/+|\/+$/g, "");
}

export function buildSignedCloudinaryUpload(
  folder: string,
  originalFilename: string,
  accountId: string
): {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  assetFolder: string;
  uploadUrl: string;
  useAssetFolderAsPublicIdPrefix: true;
} {
  const account = getCloudinaryAccount(accountId);
  const normalizedFolder = normalizeFolderInput(folder);
  const publicId = sanitizeCloudinaryBasename(originalFilename);
  if (!normalizedFolder || !publicId) {
    throw new Error("Invalid upload folder or filename");
  }

  const timestamp = Math.round(Date.now() / 1000);

  cloudinary.config({
    cloud_name: account.cloudName,
    api_key: account.apiKey,
    api_secret: account.apiSecret,
  });

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      public_id: publicId,
      asset_folder: normalizedFolder,
      use_asset_folder_as_public_id_prefix: true,
      overwrite: false,
    },
    account.apiSecret
  );

  return {
    cloudName: account.cloudName,
    apiKey: account.apiKey,
    timestamp,
    signature,
    publicId,
    assetFolder: normalizedFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${account.cloudName}/image/upload`,
    useAssetFolderAsPublicIdPrefix: true,
  };
}

export function isCloudinaryUrlForPublicId(
  secureUrl: string,
  publicId: string,
  accountId: string
): boolean {
  const account = getCloudinaryAccount(accountId);
  if (!secureUrl.startsWith(`https://res.cloudinary.com/${account.cloudName}/`)) {
    return false;
  }
  return publicIdFromUrl(secureUrl) === publicId;
}
