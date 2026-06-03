import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { listFolder } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    client_name?: string;
    cloudinary_folder?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const cloudinary_folder = body.cloudinary_folder?.trim();
  if (!name || !cloudinary_folder) {
    return NextResponse.json(
      { error: "name and cloudinary_folder are required" },
      { status: 400 }
    );
  }

  let resources;
  try {
    resources = await listFolder(cloudinary_folder);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to list Cloudinary folder",
      },
      { status: 502 }
    );
  }

  if (resources.length === 0) {
    return NextResponse.json(
      { error: `No images found in Cloudinary folder "${cloudinary_folder}"` },
      { status: 404 }
    );
  }

  const gallery_token = randomUUID();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name,
      client_name: body.client_name?.trim() || null,
      cloudinary_folder,
      gallery_token,
      status: "pending",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: projectError?.message ?? "Failed to create project" },
      { status: 500 }
    );
  }

  const rows = resources.map((r) => ({
    project_id: project.id,
    filename: r.filename,
    cloudinary_url: r.secure_url,
    is_selected: false,
  }));

  const { error: photoError } = await supabase.from("photos").insert(rows);
  if (photoError) {
    // Best-effort rollback — drop the project so it doesn't dangle.
    await supabase.from("projects").delete().eq("id", project.id);
    return NextResponse.json({ error: photoError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: project.id,
    gallery_token,
    photo_count: rows.length,
  });
}
