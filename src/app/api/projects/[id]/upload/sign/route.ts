import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { buildPhotoFilename } from "@/lib/cloudinary/filenames";
import { buildSignedCloudinaryUpload } from "@/lib/cloudinary/signedDirectUpload";
import { validateImageUploadMeta } from "@/lib/imageUploadValidation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { filename?: string; mimeType?: string; size?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const filename = body.filename?.trim() ?? "";
  const mimeType = body.mimeType ?? "";
  const size = body.size ?? 0;
  const validationError = validateImageUploadMeta(filename, mimeType, size);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, cloudinary_folder")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const storedFilename = buildPhotoFilename(filename);
  const { data: existing } = await supabase
    .from("photos")
    .select("filename")
    .eq("project_id", project.id)
    .eq("filename", storedFilename)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `${storedFilename}: already in this project` },
      { status: 400 }
    );
  }

  try {
    const signed = buildSignedCloudinaryUpload(
      project.cloudinary_folder,
      filename
    );
    return NextResponse.json(signed);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not prepare upload",
      },
      { status: 500 }
    );
  }
}
