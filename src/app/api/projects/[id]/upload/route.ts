import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { uploadImageToFolder } from "@/lib/cloudinary";
import { isAllowedImageBuffer } from "@/lib/security/imageBytes";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 40;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, cloudinary_folder")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const entries = formData.getAll("files").filter((f) => f instanceof File);
  if (entries.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }
  if (entries.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES_PER_REQUEST} files per upload` },
      { status: 400 }
    );
  }

  const { data: existingPhotos } = await supabase
    .from("photos")
    .select("filename")
    .eq("project_id", project.id);

  const existingFilenames = new Set(
    (existingPhotos ?? []).map((p) => p.filename)
  );

  const uploaded: Photo[] = [];
  const errors: string[] = [];

  for (const file of entries as File[]) {
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`${file.name}: unsupported file type`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`${file.name}: file too large (max 20MB)`);
      continue;
    }
    if (existingFilenames.has(file.name)) {
      errors.push(`${file.name}: already in this project`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!isAllowedImageBuffer(buffer, file.type)) {
        errors.push(`${file.name}: file content does not match image type`);
        continue;
      }

      const resource = await uploadImageToFolder(
        project.cloudinary_folder,
        buffer,
        file.name
      );

      const { data: row, error: insertError } = await supabase
        .from("photos")
        .insert({
          project_id: project.id,
          filename: resource.filename,
          cloudinary_url: resource.secure_url,
          is_selected: false,
        })
        .select("*")
        .single();

      if (insertError || !row) {
        errors.push(`${file.name}: ${insertError?.message ?? "DB insert failed"}`);
        continue;
      }

      existingFilenames.add(resource.filename);
      uploaded.push(row as Photo);
    } catch (err) {
      errors.push(
        `${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`
      );
    }
  }

  if (uploaded.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    uploaded: uploaded.length,
    errors,
    photos: (photos ?? []) as Photo[],
  });
}
