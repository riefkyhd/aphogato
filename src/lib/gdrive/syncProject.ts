import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listDriveFolderFiles,
  type DriveFileItem,
} from "@/lib/gdrive/client";
import {
  fetchAllProjectPhotoRows,
  fetchAllProjectPhotos,
} from "@/lib/photos/fetchProjectPhotos";
import type { Photo, PhotoStage, Project } from "@/lib/types";

type ExistingPhoto = {
  id: string;
  filename: string;
  cloudinary_url: string;
  gdrive_file_id: string | null;
  stage: PhotoStage;
  perceptual_hash: string | null;
  shot_at: string | null;
};

export async function syncGDriveProject(
  supabase: SupabaseClient,
  project: Pick<
    Project,
    "id" | "gdrive_folder_id" | "gdrive_finals_folder_id" | "cloudinary_folder"
  >,
  options?: { stage?: PhotoStage }
) {
  const stage: PhotoStage = options?.stage === "final" ? "final" : "proof";
  const folderId =
    stage === "final"
      ? project.gdrive_finals_folder_id
      : project.gdrive_folder_id;

  if (!folderId) {
    return {
      status: 400 as const,
      body: {
        error: `No Google Drive ${stage === "final" ? "Finals" : "Proofs"} folder ID configured for this project.`,
      },
    };
  }

  let files: DriveFileItem[];
  try {
    files = await listDriveFolderFiles(folderId);
  } catch (err) {
    return {
      status: 502 as const,
      body: {
        error:
          err instanceof Error
            ? err.message
            : "Failed to list Google Drive folder files",
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
          "id, filename, cloudinary_url, gdrive_file_id, stage, perceptual_hash, shot_at",
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

  // Filter existing photos for this stage only
  const existingForStage = existingPhotos.filter(
    (p) => (p.stage ?? "proof") === stage
  );

  const remoteById = new Map(files.map((f) => [f.id, f]));
  const remoteByFilename = new Map(files.map((f) => [f.name, f]));
  const existingByFilename = new Map(
    existingForStage.map((p) => [p.filename, p.id])
  );
  const existingByFileId = new Map(
    existingForStage
      .filter((p) => Boolean(p.gdrive_file_id))
      .map((p) => [p.gdrive_file_id!, p.id])
  );

  function photoExistsInDrive(photo: ExistingPhoto): boolean {
    if (photo.gdrive_file_id && remoteById.has(photo.gdrive_file_id)) {
      return true;
    }
    if (photo.cloudinary_url?.startsWith("gdrive://")) {
      const id = photo.cloudinary_url.replace("gdrive://", "");
      if (remoteById.has(id)) return true;
    }
    return remoteByFilename.has(photo.filename);
  }

  const newFiles: DriveFileItem[] = [];

  for (const file of files) {
    if (existingByFileId.has(file.id)) continue;
    if (existingByFilename.has(file.name)) continue;
    newFiles.push(file);
  }

  const idsToRemove = existingForStage
    .filter((p) => !photoExistsInDrive(p))
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
    const rows = newFiles.map((file) => {
      // EXIF time format from Google Drive imageMediaMetadata is often 'YYYY:MM:DD HH:MM:SS'
      let shot_at: string | null = null;
      if (file.imageMediaMetadata?.time) {
        const rawTime = file.imageMediaMetadata.time;
        const normalizedIso = rawTime.replace(
          /^(\d{4}):(\d{2}):(\d{2})/,
          "$1-$2-$3"
        );
        const parsed = new Date(normalizedIso);
        if (!isNaN(parsed.getTime())) {
          shot_at = parsed.toISOString();
        }
      }

      return {
        project_id: project.id,
        filename: file.name,
        cloudinary_url: `gdrive://${file.id}`,
        gdrive_file_id: file.id,
        stage,
        is_selected: false,
        perceptual_hash: null,
        shot_at,
      };
    });

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
      stage,
      shot_at_backfilled: 0,
      filenames_backfilled: 0,
      skipped_duplicates: 0,
      duplicate_warnings: [],
      total: photos.length,
      photos,
    },
  };
}
