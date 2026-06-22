import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { getProjectFaceSearchStatus } from "@/lib/faces/projectFaceCounts";

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

  try {
    const status = await getProjectFaceSearchStatus(
      supabase,
      project.id,
      Boolean(project.face_search_enabled)
    );
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load status" },
      { status: 500 }
    );
  }
}
