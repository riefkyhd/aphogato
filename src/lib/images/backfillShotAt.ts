import "server-only";
import { publicIdFromUrl } from "@/lib/cloudinary";
import { extractShotAt } from "@/lib/images/extractShotAt";

type PhotoRow = {
  id: string;
  filename: string;
  cloudinary_url: string;
  shot_at?: string | null;
};

const BATCH_SIZE = 8;

export async function backfillMissingShotAt(
  photos: PhotoRow[],
  accountId: string,
  update: (id: string, shotAt: string) => Promise<void>
): Promise<number> {
  const missing = photos.filter((photo) => !photo.shot_at);
  let updated = 0;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (photo) => {
        const publicId = publicIdFromUrl(photo.cloudinary_url);
        if (!publicId) return false;

        const shotAt = await extractShotAt(publicId, photo.filename, accountId);
        if (!shotAt) return false;

        await update(photo.id, shotAt);
        return true;
      })
    );

    updated += results.filter(Boolean).length;
  }

  return updated;
}
