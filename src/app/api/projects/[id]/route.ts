import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { deleteMediaAsset } from "@/lib/storage/deleteMediaAsset";
import { fetchAllProjectPhotoRows } from "@/lib/photos/fetchProjectPhotos";
import { parseMaxPhotoSelectionInput } from "@/lib/photoSelectionLimit";
import { renameProject } from "@/lib/renameProject";
import { normalizeProject } from "@/lib/normalizeProject";
import { parseFaceSearchEnabledInput } from "@/lib/faces/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    name?: unknown;
    max_photo_selection?: unknown;
    face_search_enabled?: unknown;
    cover_photo_id?: unknown;
    gdrive_folder_id?: unknown;
    gdrive_finals_folder_id?: unknown;
    gdrive_finals_share_url?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hasName = body.name !== undefined;
  const hasMaxSelection = body.max_photo_selection !== undefined;
  const hasFaceSearchEnabled = body.face_search_enabled !== undefined;
  const hasCoverPhotoId = body.cover_photo_id !== undefined;
  const hasGDriveFolderId = body.gdrive_folder_id !== undefined;
  const hasGDriveFinalsFolderId = body.gdrive_finals_folder_id !== undefined;
  const hasGDriveFinalsShareUrl = body.gdrive_finals_share_url !== undefined;

  if (
    !hasName &&
    !hasMaxSelection &&
    !hasFaceSearchEnabled &&
    !hasCoverPhotoId &&
    !hasGDriveFolderId &&
    !hasGDriveFinalsFolderId &&
    !hasGDriveFinalsShareUrl
  ) {
    return NextResponse.json(
      {
        error:
          "No valid fields to update",
      },
      { status: 400 }
    );
  }

  if (hasName) {
    if (typeof body.name !== "string") {
      return NextResponse.json({ error: "name must be a string" }, { status: 400 });
    }

    try {
      const result = await renameProject(supabase, params.id, body.name);
      return NextResponse.json({
        project: result.project,
        folderRenamed: result.folderRenamed,
        photosUpdated: result.photosUpdated,
        referencesUpdated: result.referencesUpdated,
        photos: result.photos,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to rename project" },
        { status: 500 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = {};

  if (hasMaxSelection) {
    const parsed = parseMaxPhotoSelectionInput(body.max_photo_selection);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    updatePayload.max_photo_selection = parsed.value;
  }

  if (hasFaceSearchEnabled) {
    const parsed = parseFaceSearchEnabledInput(body.face_search_enabled);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    updatePayload.face_search_enabled = parsed.value;
  }

  if (hasCoverPhotoId) {
    if (body.cover_photo_id === null) {
      updatePayload.cover_photo_id = null;
    } else if (typeof body.cover_photo_id === "string") {
      const trimmed = body.cover_photo_id.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "cover_photo_id must be a photo id or null" },
          { status: 400 }
        );
      }

      const { data: photo, error: photoError } = await supabase
        .from("photos")
        .select("id")
        .eq("id", trimmed)
        .eq("project_id", params.id)
        .maybeSingle();

      if (photoError) {
        return NextResponse.json({ error: photoError.message }, { status: 500 });
      }
      if (!photo) {
        return NextResponse.json(
          { error: "Photo not found in this project" },
          { status: 400 }
        );
      }

      updatePayload.cover_photo_id = trimmed;
    } else {
      return NextResponse.json(
        { error: "cover_photo_id must be a string or null" },
        { status: 400 }
      );
    }
  }

  if (hasGDriveFolderId) {
    updatePayload.gdrive_folder_id =
      typeof body.gdrive_folder_id === "string"
        ? body.gdrive_folder_id.trim() || null
        : null;
  }

  if (hasGDriveFinalsFolderId) {
    updatePayload.gdrive_finals_folder_id =
      typeof body.gdrive_finals_folder_id === "string"
        ? body.gdrive_finals_folder_id.trim() || null
        : null;
  }

  if (hasGDriveFinalsShareUrl) {
    updatePayload.gdrive_finals_share_url =
      typeof body.gdrive_finals_share_url === "string"
        ? body.gdrive_finals_share_url.trim() || null
        : null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, {
      status: 400,
    });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: error?.message ?? "Project not found" },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json({ project: normalizeProject(project) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let photos: {
    id: string;
    cloudinary_url: string;
    imagekit_file_id: string | null;
    gdrive_file_id?: string | null;
  }[];
  try {
    photos = await fetchAllProjectPhotoRows(supabase, params.id, {
      columns: "id, cloudinary_url, imagekit_file_id, gdrive_file_id",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load photos" },
      { status: 500 }
    );
  }

  const mediaErrors: string[] = [];
  for (const photo of photos) {
    try {
      await deleteMediaAsset(photo);
    } catch (err) {
      mediaErrors.push(
        err instanceof Error ? err.message : "Media delete failed"
      );
    }
  }

  const { error: deleteProjectError } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id);

  if (deleteProjectError) {
    return NextResponse.json(
      { error: deleteProjectError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    photosDeleted: photos?.length ?? 0,
    mediaErrors,
    cloudinaryErrors: mediaErrors,
  });
}
