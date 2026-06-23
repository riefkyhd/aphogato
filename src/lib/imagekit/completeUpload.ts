import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPhotoFilename } from "@/lib/cloudinary/filenames";
import { insertPhotoFaces } from "@/lib/faces/insertPhotoFaces";
import type { PhotoFaceInput } from "@/lib/faces/types";
import {
  deleteImageKitFile,
  imageKitUrlBelongsToFolder,
  isImageKitDeliveryUrl,
} from "@/lib/imagekit/client";
import {
  computeHashFromCloudinaryUrl,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { fetchAllProjectPhotoRows, fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";

type ImageKitCompleteBody = {
  fileId?: string;
  secureUrl?: string;
  originalFilename?: string;
};

type ProjectRow = {
  id: string;
  cloudinary_folder: string;
  face_search_enabled: boolean;
};

export async function completeImageKitPhotoUpload(
  supabase: SupabaseClient,
  project: ProjectRow,
  body: ImageKitCompleteBody,
  facesParsed: { faces: PhotoFaceInput[] }
) {
  const fileId = body.fileId?.trim() ?? "";
  const secureUrl = body.secureUrl?.trim() ?? "";
  if (!fileId || !secureUrl) {
    return {
      status: 400 as const,
      body: { error: "fileId and secureUrl are required" },
    };
  }

  if (!isImageKitDeliveryUrl(secureUrl)) {
    return { status: 400 as const, body: { error: "Invalid ImageKit upload" } };
  }

  if (!imageKitUrlBelongsToFolder(secureUrl, project.cloudinary_folder)) {
    return { status: 400 as const, body: { error: "Upload folder mismatch" } };
  }

  const filename = buildPhotoFilename(body.originalFilename ?? secureUrl);

  const existingPhotos = await fetchAllProjectPhotoRows<{
    filename: string;
    perceptual_hash: string | null;
  }>(supabase, project.id, {
    columns: "filename, perceptual_hash",
  });

  const existingRows: ImageHashRow[] = existingPhotos.map((p) => ({
    filename: p.filename as string,
    perceptual_hash: (p.perceptual_hash as string | null) ?? null,
  }));

  async function cleanupUpload() {
    try {
      await deleteImageKitFile(fileId);
    } catch {
      // Best-effort cleanup.
    }
  }

  if (existingRows.some((row) => row.filename === filename)) {
    await cleanupUpload();
    return {
      status: 400 as const,
      body: { error: `${filename}: already in this project` },
    };
  }

  const perceptualHash = await computeHashFromCloudinaryUrl(secureUrl);
  if (perceptualHash) {
    const duplicateOf = findDuplicateFilename(perceptualHash, existingRows);
    if (duplicateOf) {
      await cleanupUpload();
      return {
        status: 400 as const,
        body: { error: `${filename}: duplicate of ${duplicateOf} (same image)` },
      };
    }
  }

  const { data: lateDuplicate } = await supabase
    .from("photos")
    .select("filename")
    .eq("project_id", project.id)
    .eq("filename", filename)
    .maybeSingle();

  if (lateDuplicate) {
    await cleanupUpload();
    return {
      status: 400 as const,
      body: { error: `${filename}: already in this project` },
    };
  }

  const { data: row, error: insertError } = await supabase
    .from("photos")
    .insert({
      project_id: project.id,
      filename,
      cloudinary_url: secureUrl,
      imagekit_file_id: fileId,
      is_selected: false,
      perceptual_hash: perceptualHash,
      shot_at: null,
    })
    .select("*")
    .single();

  if (insertError || !row) {
    await cleanupUpload();
    if (insertError?.code === "23505") {
      return {
        status: 400 as const,
        body: { error: `${filename}: already in this project` },
      };
    }
    return {
      status: 500 as const,
      body: { error: insertError?.message ?? "DB insert failed" },
    };
  }

  if (project.face_search_enabled) {
    const { error: markIndexedError } = await supabase
      .from("photos")
      .update({ face_indexed_at: new Date().toISOString() })
      .eq("id", row.id);

    if (markIndexedError) {
      await supabase.from("photos").delete().eq("id", row.id);
      await cleanupUpload();
      return { status: 500 as const, body: { error: markIndexedError.message } };
    }
  }

  if (project.face_search_enabled && facesParsed.faces.length > 0) {
    const faceInsert = await insertPhotoFaces(
      supabase,
      project.id,
      row.id,
      facesParsed.faces
    );
    if (faceInsert.error) {
      await supabase.from("photos").delete().eq("id", row.id);
      await cleanupUpload();
      return {
        status: 500 as const,
        body: { error: faceInsert.error ?? "Failed to save face data" },
      };
    }
  }

  const photos = await fetchAllProjectPhotos(supabase, project.id);

  return {
    status: 200 as const,
    body: {
      uploaded: 1,
      errors: [] as string[],
      photos,
    },
  };
}
