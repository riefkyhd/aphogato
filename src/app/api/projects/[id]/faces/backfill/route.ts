import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { insertPhotoFaces } from "@/lib/faces/insertPhotoFaces";
import { parsePhotoFacesInput } from "@/lib/faces/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const photoId = typeof body.photoId === "string" ? body.photoId.trim() : "";
  if (!photoId) {
    return NextResponse.json({ error: "photoId is required" }, { status: 400 });
  }

  const facesParsed = parsePhotoFacesInput(body.faces);
  if (!facesParsed.ok) {
    return NextResponse.json({ error: facesParsed.error }, { status: 400 });
  }

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

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id")
    .eq("id", photoId)
    .eq("project_id", project.id)
    .maybeSingle();

  if (photoError) {
    return NextResponse.json({ error: photoError.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await supabase.from("photo_faces").delete().eq("photo_id", photoId);

  if (facesParsed.faces.length === 0) {
    return NextResponse.json({ ok: true, faceCount: 0 });
  }

  const faceInsert = await insertPhotoFaces(
    supabase,
    project.id,
    photoId,
    facesParsed.faces
  );
  if (faceInsert.error) {
    return NextResponse.json(
      { error: faceInsert.error ?? "Failed to save face data" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, faceCount: facesParsed.faces.length });
}
