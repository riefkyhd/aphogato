import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { listFolder, publicIdFromUrl } from "@/lib/cloudinary";
import {
  backfillMissingHashes,
  computeHashFromCloudinaryUrl,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { backfillMissingShotAt } from "@/lib/images/backfillShotAt";
import { extractShotAt } from "@/lib/images/extractShotAt";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, cloudinary_folder")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let resources;
  try {
    resources = await listFolder(project.cloudinary_folder);
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

  const { data: existingPhotos, error: existingError } = await supabase
    .from("photos")
    .select("id, filename, cloudinary_url, perceptual_hash, shot_at")
    .eq("project_id", project.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  type ExistingPhoto = {
    id: string;
    filename: string;
    cloudinary_url: string;
    perceptual_hash: string | null;
    shot_at: string | null;
  };

  const existing = await backfillMissingHashes(
    (existingPhotos ?? []) as ExistingPhoto[],
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

  const shotAtBackfilled = await backfillMissingShotAt(existing, async (id, shotAt) => {
    await supabase.from("photos").update({ shot_at: shotAt }).eq("id", id);
  });

  if (newResources.length > 0) {
    const rows = await Promise.all(
      newResources.map(async (r) => ({
        project_id: project.id,
        filename: r.filename,
        cloudinary_url: r.secure_url,
        is_selected: false,
        perceptual_hash: r.perceptual_hash,
        shot_at: await extractShotAt(r.public_id, r.filename),
      }))
    );

    const { error: insertError } = await supabase.from("photos").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const added = newResources.length;
  const removed = idsToRemove.length;
  const total = (photos ?? []).length;

  return NextResponse.json({
    added,
    removed,
    shot_at_backfilled: shotAtBackfilled,
    skipped_duplicates: skippedDuplicates.length,
    duplicate_warnings: skippedDuplicates,
    total,
    photos: (photos ?? []) as Photo[],
  });
}
