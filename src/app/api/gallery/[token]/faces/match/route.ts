import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { normalizeProject } from "@/lib/normalizeProject";
import { getProjectFaceSearchStatus } from "@/lib/faces/projectFaceCounts";
import { matchPhotoFaces } from "@/lib/faces/matchPhotoFaces";
import { parseFaceMatchBody } from "@/lib/faces/validation";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseFaceMatchBody(body);
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  const supabase = createAdminSupabase();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("gallery_token", params.token)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  const normalized = normalizeProject(project as Project);
  if (!normalized.face_search_enabled) {
    return NextResponse.json(
      { error: "Face search is not enabled for this gallery" },
      { status: 403 }
    );
  }

  const faceSearch = await getProjectFaceSearchStatus(
    supabase,
    normalized.id,
    true
  );
  if (faceSearch.status !== "ready") {
    return NextResponse.json(
      { error: "Face search is not ready for this gallery" },
      { status: 403 }
    );
  }

  try {
    const result = await matchPhotoFaces(
      supabase,
      normalized.id,
      parsed.data.embedding,
      parsed.data.threshold
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Face match failed" },
      { status: 500 }
    );
  }
}
