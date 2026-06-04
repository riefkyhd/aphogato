import { NextResponse } from "next/server";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      await deleteCloudinaryImageByUrl(photo.cloudinary_url);
    } catch (err) {
      errors.push(
        `${photo.filename}: ${
          err instanceof Error ? err.message : "Cloudinary delete failed"
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

  const { data: remaining, error: remainingError } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", params.id)
    .order("created_at", { ascending: false });

  if (remainingError) {
    return NextResponse.json({ error: remainingError.message }, { status: 500 });
  }

  return NextResponse.json({
    deleted: idsToRemove.length,
    errors,
    photos: (remaining ?? []) as Photo[],
  });
}
