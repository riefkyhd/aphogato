import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { listFolder, publicIdFromUrl } from "@/lib/cloudinary";
import { getProjectCloudinaryAccountId } from "@/lib/cloudinary/accounts";
import { syncImageKitProject } from "@/lib/imagekit/syncProject";
import { syncGDriveProject } from "@/lib/gdrive/syncProject";
import { getProjectStorageProvider } from "@/lib/storage/provider";
import {
  backfillMissingHashes,
  computeHashFromCloudinaryUrl,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { backfillDerivedFilenames } from "@/lib/images/backfillFilenames";
import { backfillMissingShotAt } from "@/lib/images/backfillShotAt";
import { extractShotAt } from "@/lib/images/extractShotAt";
import { fetchAllProjectPhotoRows, fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import type { Photo, PhotoStage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { stage?: PhotoStage } = {};
  try {
    body = (await request.json().catch(() => ({}))) as { stage?: PhotoStage };
  } catch {
    // optional body
  }
  const stage: PhotoStage = body.stage === "final" ? "final" : "proof";

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, cloudinary_folder, cloudinary_account, storage_provider, gdrive_folder_id, gdrive_finals_folder_id")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const provider = getProjectStorageProvider(project);

  if (provider === "gdrive") {
    const result = await syncGDriveProject(supabase, project, { stage });
    return NextResponse.json(result.body, { status: result.status });
  }

  if (provider === "imagekit") {
    const result = await syncImageKitProject(supabase, project);
    return NextResponse.json(result.body, { status: result.status });
  }

  const accountId = getProjectCloudinaryAccountId(project);

  let resources;
  try {
    resources = await listFolder(project.cloudinary_folder, accountId);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to list Cloudinary folder",
      },
      { status: 502 }
    );
  }

  type ExistingPhoto = {
    id: string;
    filename: string;
    cloudinary_url: string;
    perceptual_hash: string | null;
    shot_at: string | null;
  };

  let existingPhotos: ExistingPhoto[];
  try {
    existingPhotos = await fetchAllProjectPhotoRows<ExistingPhoto>(
      supabase,
      project.id,
      { columns: "id, filename, cloudinary_url, perceptual_hash, shot_at" }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load photos" },
      { status: 500 }
    );
  }

  const existing = await backfillMissingHashes(
    existingPhotos,
    async (id, hash) => {
      await supabase.from("photos").update({ perceptual_hash: hash }).eq("id", id);
    }
  );

  const cloudinaryFilenames = new Set(resources.map((r) => r.filename));
  const cloudinaryFilenamesLower = new Set(
    resources.map((r) => r.filename.toLowerCase())
  );
  const cloudinaryPublicIds = new Set(resources.map((r) => r.public_id));
  const existingByFilename = new Map(existing.map((p) => [p.filename, p.id]));

  function photoExistsInCloudinary(photo: ExistingPhoto): boolean {
    if (cloudinaryFilenames.has(photo.filename)) return true;
    if (cloudinaryFilenamesLower.has(photo.filename.toLowerCase())) return true;
    const publicId = publicIdFromUrl(photo.cloudinary_url);
    return Boolean(publicId && cloudinaryPublicIds.has(publicId));
  }
  const hashRows: ImageHashRow[] = existing.map((p) => ({
    filename: p.filename,
    perceptual_hash: p.perceptual_hash,
  }));

  const newResources = [];
  const skippedDuplicates: string[] = [];

  for (const resource of resources) {
    if (existingByFilename.has(resource.filename)) continue;

    const hash = await computeHashFromCloudinaryUrl(resource.secure_url);
    if (hash) {
      const duplicateOf = findDuplicateFilename(hash, hashRows);
      if (duplicateOf) {
        skippedDuplicates.push(`${resource.filename} (duplicate of ${duplicateOf})`);
        continue;
      }
    }

    newResources.push({ ...resource, perceptual_hash: hash });
    hashRows.push({
      filename: resource.filename,
      perceptual_hash: hash,
    });
  }

  const idsToRemove = existing
    .filter((p) => !photoExistsInCloudinary(p))
    .map((p) => p.id);

  if (idsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .in("id", idsToRemove);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const shotAtBackfilled = await backfillMissingShotAt(
    existing,
    accountId,
    async (id, shotAt) => {
    await supabase.from("photos").update({ shot_at: shotAt }).eq("id", id);
  });

  const filenamesBackfilled = await backfillDerivedFilenames(
    existing,
    accountId,
    async (id, filename) => {
      await supabase.from("photos").update({ filename }).eq("id", id);
    }
  );

  if (newResources.length > 0) {
    const rows = await Promise.all(
      newResources.map(async (r) => ({
        project_id: project.id,
        filename: r.filename,
        cloudinary_url: r.secure_url,
        is_selected: false,
        perceptual_hash: r.perceptual_hash,
        shot_at: await extractShotAt(r.public_id, r.filename, accountId),
      }))
    );

    const { error: insertError } = await supabase.from("photos").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  let photos: Photo[];
  try {
    photos = await fetchAllProjectPhotos(supabase, project.id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load photos" },
      { status: 500 }
    );
  }

  const added = newResources.length;
  const removed = idsToRemove.length;
  const total = photos.length;

  return NextResponse.json({
    added,
    removed,
    shot_at_backfilled: shotAtBackfilled,
    filenames_backfilled: filenamesBackfilled,
    skipped_duplicates: skippedDuplicates.length,
    duplicate_warnings: skippedDuplicates,
    total,
    photos,
  });
}
