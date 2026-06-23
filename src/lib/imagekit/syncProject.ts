import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  imageKitFilenameFromFile,
  listImageKitFolder,
  type ImageKitFile,
} from "@/lib/imagekit/client";
import {
  backfillMissingHashes,
  computeHashFromCloudinaryUrl,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { fetchAllProjectPhotoRows, fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import type { Photo } from "@/lib/types";

type ExistingPhoto = {
  id: string;
  filename: string;
  cloudinary_url: string;
  imagekit_file_id: string | null;
  perceptual_hash: string | null;
  shot_at: string | null;
};

export async function syncImageKitProject(
  supabase: SupabaseClient,
  project: { id: string; cloudinary_folder: string }
) {
  let files: ImageKitFile[];
  try {
    files = await listImageKitFolder(project.cloudinary_folder);
  } catch (err) {
    return {
      status: 502 as const,
      body: {
        error:
          err instanceof Error ? err.message : "Failed to list ImageKit folder",
      },
    };
  }

  let existingPhotos: ExistingPhoto[];
  try {
    existingPhotos = await fetchAllProjectPhotoRows<ExistingPhoto>(
      supabase,
      project.id,
      {
        columns:
          "id, filename, cloudinary_url, imagekit_file_id, perceptual_hash, shot_at",
      }
    );
  } catch (err) {
    return {
      status: 500 as const,
      body: {
        error: err instanceof Error ? err.message : "Failed to load photos",
      },
    };
  }

  const existing = await backfillMissingHashes(
    existingPhotos,
    async (id, hash) => {
      await supabase.from("photos").update({ perceptual_hash: hash }).eq("id", id);
    }
  );

  const remoteByFilename = new Map(
    files.map((file) => [imageKitFilenameFromFile(file), file])
  );
  const remoteFilenamesLower = new Set(
    [...remoteByFilename.keys()].map((name) => name.toLowerCase())
  );
  const remoteFileIds = new Set(files.map((file) => file.fileId));
  const existingByFilename = new Map(existing.map((p) => [p.filename, p.id]));

  function photoExistsInImageKit(photo: ExistingPhoto): boolean {
    if (remoteByFilename.has(photo.filename)) return true;
    if (remoteFilenamesLower.has(photo.filename.toLowerCase())) return true;
    if (photo.imagekit_file_id && remoteFileIds.has(photo.imagekit_file_id)) {
      return true;
    }
    return files.some((file) => file.url === photo.cloudinary_url);
  }

  const hashRows: ImageHashRow[] = existing.map((p) => ({
    filename: p.filename,
    perceptual_hash: p.perceptual_hash,
  }));

  const newFiles = [];
  const skippedDuplicates: string[] = [];

  for (const file of files) {
    const filename = imageKitFilenameFromFile(file);
    if (existingByFilename.has(filename)) continue;

    const hash = await computeHashFromCloudinaryUrl(file.url);
    if (hash) {
      const duplicateOf = findDuplicateFilename(hash, hashRows);
      if (duplicateOf) {
        skippedDuplicates.push(`${filename} (duplicate of ${duplicateOf})`);
        continue;
      }
    }

    newFiles.push({ file, filename, perceptual_hash: hash });
    hashRows.push({ filename, perceptual_hash: hash });
  }

  const idsToRemove = existing
    .filter((p) => !photoExistsInImageKit(p))
    .map((p) => p.id);

  if (idsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .in("id", idsToRemove);
    if (deleteError) {
      return { status: 500 as const, body: { error: deleteError.message } };
    }
  }

  if (newFiles.length > 0) {
    const rows = newFiles.map(({ file, filename, perceptual_hash }) => ({
      project_id: project.id,
      filename,
      cloudinary_url: file.url,
      imagekit_file_id: file.fileId,
      is_selected: false,
      perceptual_hash,
      shot_at: null,
    }));

    const { error: insertError } = await supabase.from("photos").insert(rows);
    if (insertError) {
      return { status: 500 as const, body: { error: insertError.message } };
    }
  }

  let photos: Photo[];
  try {
    photos = await fetchAllProjectPhotos(supabase, project.id);
  } catch (err) {
    return {
      status: 500 as const,
      body: {
        error: err instanceof Error ? err.message : "Failed to load photos",
      },
    };
  }

  return {
    status: 200 as const,
    body: {
      added: newFiles.length,
      removed: idsToRemove.length,
      shot_at_backfilled: 0,
      filenames_backfilled: 0,
      skipped_duplicates: skippedDuplicates.length,
      duplicate_warnings: skippedDuplicates,
      total: photos.length,
      photos,
    },
  };
}
