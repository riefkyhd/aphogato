import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { getProjectCloudinaryAccountId } from "@/lib/cloudinary/accounts";
import {
  isCloudinaryUrlForPublicId,
  publicIdBelongsToAssetFolder,
  resolveStoredUploadFilename,
} from "@/lib/cloudinary/signedDirectUpload";
import {
  computeHashFromCloudinaryUrl,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { extractShotAt } from "@/lib/images/extractShotAt";
import {
  fetchAllProjectPhotoRows,
  fetchAllProjectPhotos,
} from "@/lib/photos/fetchProjectPhotos";
import { insertPhotoFaces } from "@/lib/faces/insertPhotoFaces";
import { parsePhotoFacesInput } from "@/lib/faces/validation";
import { completeImageKitPhotoUpload } from "@/lib/imagekit/completeUpload";
import { getDriveFileMeta } from "@/lib/gdrive/client";
import { getProjectStorageProvider } from "@/lib/storage/provider";
import type { PhotoStage } from "@/lib/types";

export const runtime = "nodejs";

type CompleteBody = {
  publicId?: string;
  fileId?: string;
  secureUrl?: string;
  originalFilename?: string;
  stage?: PhotoStage;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  faces?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: CompleteBody;
  try {
    body = (await request.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const stage: PhotoStage = body.stage === "final" ? "final" : "proof";
  const publicId = body.publicId?.trim() ?? "";
  const secureUrl = body.secureUrl?.trim() ?? "";
  const fileId = body.fileId?.trim() ?? "";

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, cloudinary_folder, cloudinary_account, face_search_enabled, storage_provider"
    )
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const facesParsed = parsePhotoFacesInput(body.faces);
  if (!facesParsed.ok) {
    return NextResponse.json({ error: facesParsed.error }, { status: 400 });
  }

  const provider = getProjectStorageProvider(project);

  // Handle Google Drive completion
  if (provider === "gdrive") {
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const filename = body.originalFilename?.trim() || "photo.jpg";
    let shotAt: string | null = null;

    try {
      const meta = await getDriveFileMeta(fileId);
      if (meta?.imageMediaMetadata?.time) {
        const rawTime = meta.imageMediaMetadata.time;
        const normalizedIso = rawTime.replace(
          /^(\d{4}):(\d{2}):(\d{2})/,
          "$1-$2-$3"
        );
        const parsed = new Date(normalizedIso);
        if (!isNaN(parsed.getTime())) {
          shotAt = parsed.toISOString();
        }
      }
    } catch {
      // Non-fatal if metadata fetch fails
    }

    const { data: row, error: insertError } = await supabase
      .from("photos")
      .insert({
        project_id: project.id,
        filename,
        cloudinary_url: `gdrive://${fileId}`,
        gdrive_file_id: fileId,
        stage,
        is_selected: false,
        perceptual_hash: null,
        shot_at: shotAt,
      })
      .select("*")
      .single();

    if (insertError || !row) {
      return NextResponse.json(
        { error: insertError?.message ?? "DB insert failed" },
        { status: 500 }
      );
    }

    if (project.face_search_enabled && facesParsed.faces.length > 0) {
      await insertPhotoFaces(supabase, project.id, row.id, facesParsed.faces);
    }

    const photos = await fetchAllProjectPhotos(supabase, project.id);
    return NextResponse.json({
      uploaded: 1,
      errors: [] as string[],
      photos,
    });
  }

  if (facesParsed.faces.length > 0 && !project.face_search_enabled) {
    return NextResponse.json(
      { error: "Face search is not enabled for this project" },
      { status: 400 }
    );
  }

  if (provider === "imagekit") {
    const result = await completeImageKitPhotoUpload(
      supabase,
      project,
      body,
      facesParsed
    );
    return NextResponse.json(result.body, { status: result.status });
  }

  if (!publicId || !secureUrl) {
    return NextResponse.json(
      { error: "publicId and secureUrl are required" },
      { status: 400 }
    );
  }

  const accountId = getProjectCloudinaryAccountId(project);

  if (!isCloudinaryUrlForPublicId(secureUrl, publicId, accountId)) {
    return NextResponse.json({ error: "Invalid Cloudinary upload" }, { status: 400 });
  }

  const normalizedFolder = project.cloudinary_folder.replace(/^\/+|\/+$/g, "");
  if (
    !publicIdBelongsToAssetFolder(
      publicId,
      normalizedFolder,
      body.originalFilename
    )
  ) {
    return NextResponse.json({ error: "Upload folder mismatch" }, { status: 400 });
  }

  const filename = resolveStoredUploadFilename(
    body.originalFilename,
    publicId,
    body.format
  );

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

  if (existingRows.some((row) => row.filename === filename)) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup for duplicate filename race.
    }
    return NextResponse.json(
      { error: `${filename}: already in this project` },
      { status: 400 }
    );
  }

  const perceptualHash = await computeHashFromCloudinaryUrl(secureUrl);
  if (perceptualHash) {
    const duplicateOf = findDuplicateFilename(perceptualHash, existingRows);
    if (duplicateOf) {
      try {
        await deleteCloudinaryImageByUrl(secureUrl);
      } catch {
        // Best-effort cleanup for perceptual duplicate.
      }
      return NextResponse.json(
        { error: `${filename}: duplicate of ${duplicateOf} (same image)` },
        { status: 400 }
      );
    }
  }

  const { data: lateDuplicate } = await supabase
    .from("photos")
    .select("filename")
    .eq("project_id", project.id)
    .eq("filename", filename)
    .eq("stage", stage)
    .maybeSingle();

  if (lateDuplicate) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup for duplicate filename race.
    }
    return NextResponse.json(
      { error: `${filename}: already in this project` },
      { status: 400 }
    );
  }

  const shotAt = await extractShotAt(publicId, filename, accountId);

  const { data: row, error: insertError } = await supabase
    .from("photos")
    .insert({
      project_id: project.id,
      filename,
      cloudinary_url: secureUrl,
      stage,
      is_selected: false,
      perceptual_hash: perceptualHash,
      shot_at: shotAt,
    })
    .select("*")
    .single();

  if (insertError || !row) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup when DB insert fails.
    }
    if (insertError?.code === "23505") {
      return NextResponse.json(
        { error: `${filename}: already in this project` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: insertError?.message ?? "DB insert failed" },
      { status: 500 }
    );
  }

  if (project.face_search_enabled) {
    const { error: markIndexedError } = await supabase
      .from("photos")
      .update({ face_indexed_at: new Date().toISOString() })
      .eq("id", row.id);

    if (markIndexedError) {
      await supabase.from("photos").delete().eq("id", row.id);
      try {
        await deleteCloudinaryImageByUrl(secureUrl);
      } catch {
        // Best-effort cleanup when face index marker fails.
      }
      return NextResponse.json(
        { error: markIndexedError.message },
        { status: 500 }
      );
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
      try {
        await deleteCloudinaryImageByUrl(secureUrl);
      } catch {
        // Best-effort cleanup when face insert fails.
      }
      return NextResponse.json(
        { error: faceInsert.error ?? "Failed to save face data" },
        { status: 500 }
      );
    }
  }

  const photos = await fetchAllProjectPhotos(supabase, project.id);

  return NextResponse.json({
    uploaded: 1,
    errors: [] as string[],
    photos,
  });
}
