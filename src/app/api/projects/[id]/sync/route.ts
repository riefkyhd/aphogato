import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { listFolder } from "@/lib/cloudinary";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

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
    .select("id, filename")
    .eq("project_id", project.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existing = existingPhotos ?? [];
  const cloudinaryFilenames = new Set(resources.map((r) => r.filename));
  const existingByFilename = new Map(existing.map((p) => [p.filename, p.id]));

  const newResources = resources.filter(
    (r) => !existingByFilename.has(r.filename)
  );

  const idsToRemove = existing
    .filter((p) => !cloudinaryFilenames.has(p.filename))
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

  if (newResources.length > 0) {
    const rows = newResources.map((r) => ({
      project_id: project.id,
      filename: r.filename,
      cloudinary_url: r.secure_url,
      is_selected: false,
    }));

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
    total,
    photos: (photos ?? []) as Photo[],
  });
}
