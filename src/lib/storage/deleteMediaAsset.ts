import "server-only";

import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { deleteImageKitFile, isImageKitDeliveryUrl } from "@/lib/imagekit/client";

export async function deleteMediaAsset(photo: {
  cloudinary_url: string;
  imagekit_file_id?: string | null;
}): Promise<void> {
  if (photo.imagekit_file_id) {
    await deleteImageKitFile(photo.imagekit_file_id);
    return;
  }

  if (isImageKitDeliveryUrl(photo.cloudinary_url)) {
    return;
  }

  await deleteCloudinaryImageByUrl(photo.cloudinary_url);
}
