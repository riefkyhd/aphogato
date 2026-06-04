import { NextResponse } from "next/server";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import { requireAuth } from "@/lib/api/requireAuth";
import { parseMaxPhotoSelectionInput } from "@/lib/photoSelectionLimit";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { max_photo_selection?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.max_photo_selection === undefined) {
    return NextResponse.json(
      { error: "max_photo_selection is required" },
      { status: 400 }
    );
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

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, cloudinary_url")
    .eq("project_id", params.id);

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const cloudinaryErrors: string[] = [];
  for (const photo of photos ?? []) {
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
