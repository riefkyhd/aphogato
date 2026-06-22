import { faceIndexImageUrl } from "@/lib/cloudinaryUrls";
import {
  indexFacesFromImageUrl,
  preloadFaceIndexWorker,
} from "@/lib/faces/faceIndexClient";

type UnindexedPhoto = {
  id: string;
  cloudinary_url: string;
  filename: string;
};

export async function reindexUnindexedProjectPhotos(
  projectId: string,
  onProgress?: (done: number, total: number, fileName: string) => void
): Promise<{ indexed: number; skipped: number; errors: string[] }> {
  preloadFaceIndexWorker();

  const res = await fetch(`/api/projects/${projectId}/faces/unindexed`);
  const json = (await res.json()) as {
    photos?: UnindexedPhoto[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to load unindexed photos");
  }

  const photos = json.photos ?? [];
  let indexed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    onProgress?.(i + 1, photos.length, photo.filename);

    try {
      const imageUrl = faceIndexImageUrl(photo.cloudinary_url);
      const faces = await indexFacesFromImageUrl(imageUrl);

      const saveRes = await fetch(`/api/projects/${projectId}/faces/backfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, faces }),
      });
      const saveJson = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(saveJson.error ?? "Failed to save face data");
      }

      if (faces.length > 0) {
        indexed += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      errors.push(
        `${photo.filename}: ${err instanceof Error ? err.message : "failed"}`
      );
    }
  }

  return { indexed, skipped, errors };
}
