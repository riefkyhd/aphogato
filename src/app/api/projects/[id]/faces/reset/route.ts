import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";

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

  const { error: facesError } = await supabase
    .from("photo_faces")
    .delete()
    .eq("project_id", project.id);

  if (facesError) {
    return NextResponse.json({ error: facesError.message }, { status: 500 });
  }

  const { error: photosError } = await supabase
    .from("photos")
    .update({ face_indexed_at: null })
    .eq("project_id", project.id);

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
