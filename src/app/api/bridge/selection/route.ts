import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function basenameWithoutExtension(filename: string): string {
  const trimmed = filename.trim();
  const lastSlash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const base = lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return stem.toLowerCase();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  const token = url.searchParams.get("token");

  if (!projectId || !token) {
    return NextResponse.json(
      { error: "project_id and token are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabase();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, client_name, gallery_token")
    .eq("id", projectId)
    .eq("gallery_token", token)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json(
      { error: projectError.message },
      { status: 500 }
    );
  }

  if (!project) {
    return NextResponse.json({ error: "Invalid project or token" }, { status: 403 });
  }

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("filename")
    .eq("project_id", projectId)
    .eq("is_selected", true);

  if (photosError) {
    return NextResponse.json({ error: photosError.message }, { status: 500 });
  }

  const filenames = (photos ?? [])
    .map((photo) => basenameWithoutExtension(photo.filename))
    .filter((name) => name.length > 0);

  return NextResponse.json({
    project_name: project.name,
    client_name: project.client_name ?? "",
    selected_count: filenames.length,
    filenames,
  });
}
