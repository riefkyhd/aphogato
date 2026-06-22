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
    .is("face_indexed_at", null)
    .order("created_at", { ascending: false });

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  return NextResponse.json({
    photos: (photos ?? []).map((photo) => ({
      id: photo.id,
      cloudinary_url: photo.cloudinary_url,
      filename: photo.filename,
    })),
  });
}
