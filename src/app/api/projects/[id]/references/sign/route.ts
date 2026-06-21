import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { buildSignedCloudinaryUpload } from "@/lib/cloudinary/signedDirectUpload";
import { getProjectCloudinaryAccountId } from "@/lib/cloudinary/accounts";
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
    .select("id, cloudinary_folder, cloudinary_account")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("project_references")
    .select("filename")
    .eq("project_id", project.id)
    .eq("filename", filename)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `${filename}: already in moodboard` },
      { status: 400 }
    );
  }

  try {
    const signed = buildSignedCloudinaryUpload(
      `${project.cloudinary_folder}/references`,
      filename,
      getProjectCloudinaryAccountId(project)
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
