import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/api/requireAuth";
import { parseMaxPhotoSelectionInput } from "@/lib/photoSelectionLimit";
import { resolveUniqueCloudinaryFolder } from "@/lib/resolveCloudinaryFolder";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { name?: string; client_name?: string; max_photo_selection?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  let cloudinary_folder: string;
  try {
    cloudinary_folder = await resolveUniqueCloudinaryFolder(supabase, name);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate folder path",
      },
      { status: 400 }
    );
  }

  const maxParsed = parseMaxPhotoSelectionInput(body.max_photo_selection);
  if (!maxParsed.ok) {
    return NextResponse.json({ error: maxParsed.error }, { status: 400 });
  }

  const gallery_token = nanoid();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name,
      client_name: body.client_name?.trim() || null,
      cloudinary_folder,
      gallery_token,
      status: "pending",
      max_photo_selection: maxParsed.value,
    })
    .select("id, cloudinary_folder")
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: projectError?.message ?? "Failed to create project" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: project.id,
    gallery_token,
    cloudinary_folder: project.cloudinary_folder,
  });
}
