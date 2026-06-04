import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { resolveUniqueCloudinaryFolder } from "@/lib/resolveCloudinaryFolder";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; client_name?: string };
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

  const gallery_token = nanoid();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name,
      client_name: body.client_name?.trim() || null,
      cloudinary_folder,
      gallery_token,
      status: "pending",
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
