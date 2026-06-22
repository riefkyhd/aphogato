import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, face_search_enabled")
    .eq("id", params.id)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (!project.face_search_enabled) {
    return NextResponse.json(
      { error: "Face search is not enabled for this project" },
      { status: 400 }
    );
  }

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, cloudinary_url, filename")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const { data: indexedRows, error: indexedError } = await supabase
    .from("photo_faces")
    .select("photo_id")
    .eq("project_id", project.id);

  if (indexedError) {
    return NextResponse.json({ error: indexedError.message }, { status: 500 });
  }

  const indexedIds = new Set(
    (indexedRows ?? []).map((row) => row.photo_id as string)
  );

  const unindexed = (photos ?? []).filter((photo) => !indexedIds.has(photo.id));

  return NextResponse.json({
    photos: unindexed.map((photo) => ({
      id: photo.id,
      cloudinary_url: photo.cloudinary_url,
      filename: photo.filename,
    })),
  });
}
