import { NextResponse } from "next/server";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/api/requireAuth";
import { fetchAllProjectPhotoRows } from "@/lib/photos/fetchProjectPhotos";
import { parseMaxPhotoSelectionInput } from "@/lib/photoSelectionLimit";
import { renameProject } from "@/lib/renameProject";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { name?: unknown; max_photo_selection?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hasName = body.name !== undefined;
  const hasMaxSelection = body.max_photo_selection !== undefined;

  if (!hasName && !hasMaxSelection) {
    return NextResponse.json(
      { error: "name or max_photo_selection is required" },
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

  const parsed = parseMaxPhotoSelectionInput(body.max_photo_selection);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update({ max_photo_selection: parsed.value })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: error?.message ?? "Project not found" },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json({ project });
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

  let photos: { id: string; cloudinary_url: string }[];
  try {
    photos = await fetchAllProjectPhotoRows(supabase, params.id, {
      columns: "id, cloudinary_url",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load photos" },
      { status: 500 }
    );
  }

  const cloudinaryErrors: string[] = [];
  for (const photo of photos) {
    try {
      await deleteCloudinaryImageByUrl(photo.cloudinary_url);
    } catch (err) {
      cloudinaryErrors.push(
        err instanceof Error ? err.message : "Cloudinary delete failed"
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
    cloudinaryErrors,
  });
}
