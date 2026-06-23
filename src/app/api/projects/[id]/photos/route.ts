import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { deleteMediaAsset } from "@/lib/storage/deleteMediaAsset";
import { fetchAllProjectPhotos } from "@/lib/photos/fetchProjectPhotos";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { photoIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const photoIds = body.photoIds?.filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
  if (!photoIds?.length) {
    return NextResponse.json({ error: "photoIds is required" }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: photos, error: fetchError } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", params.id)
    .in("id", photoIds);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!photos?.length) {
    return NextResponse.json({ error: "No matching photos found" }, { status: 404 });
  }

  const errors: string[] = [];
  for (const photo of photos) {
    try {
      await deleteMediaAsset(photo);
    } catch (err) {
      errors.push(
        `${photo.filename}: ${
          err instanceof Error ? err.message : "Media delete failed"
        }`
      );
    }
  }

  const idsToRemove = photos.map((p) => p.id);
  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .in("id", idsToRemove);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  let remaining: Photo[];
  try {
    remaining = await fetchAllProjectPhotos(supabase, params.id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load photos" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deleted: idsToRemove.length,
    errors,
    photos: remaining,
  });
}
