import "server-only";

import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { deleteImageKitFile, isImageKitDeliveryUrl } from "@/lib/imagekit/client";
import { deleteDriveFile } from "@/lib/gdrive/client";
import { isGDriveUrl } from "@/lib/gdriveUrls";

export async function deleteMediaAsset(photo: {
  cloudinary_url: string;
  imagekit_file_id?: string | null;
  gdrive_file_id?: string | null;
}): Promise<void> {
  if (photo.gdrive_file_id) {
    await deleteDriveFile(photo.gdrive_file_id);
    return;
  }

  if (isGDriveUrl(photo.cloudinary_url)) {
    const fileId = photo.cloudinary_url.replace("gdrive://", "");
    await deleteDriveFile(fileId);
    return;
  }

  if (photo.imagekit_file_id) {
    await deleteImageKitFile(photo.imagekit_file_id);
    return;
  }

  if (isImageKitDeliveryUrl(photo.cloudinary_url)) {
    return;
  }

  await deleteCloudinaryImageByUrl(photo.cloudinary_url);
}
