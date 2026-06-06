import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { uploadImageToFolder } from "@/lib/cloudinary";
import {
  computeHashFromBuffer,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { isAllowedImageBuffer } from "@/lib/security/imageBytes";
import type { ProjectReference } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 20;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("project_references")
    .select("*")
    .eq("project_id", params.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as ProjectReference[]);
}

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

  const { data: existingRefs } = await supabase
    .from("project_references")
    .select("filename, sort_order, perceptual_hash")
    .eq("project_id", project.id);

  const existingRows: ImageHashRow[] = (existingRefs ?? []).map((r) => ({
    filename: r.filename as string,
    perceptual_hash: (r.perceptual_hash as string | null) ?? null,
  }));
  const existingFilenames = new Set(existingRows.map((r) => r.filename));
  const baseSortOrder =
    (existingRefs ?? []).reduce(
      (max, r) => Math.max(max, r.sort_order ?? 0),
      -1
    ) + 1;

  const refFolder = `${project.cloudinary_folder}/references`;
  const uploaded: ProjectReference[] = [];
  const errors: string[] = [];
  let sortOrder = baseSortOrder;

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
      errors.push(`${file.name}: already in moodboard`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!isAllowedImageBuffer(buffer, file.type)) {
        errors.push(`${file.name}: file content does not match image type`);
        continue;
      }

      const perceptualHash = await computeHashFromBuffer(buffer);
      if (perceptualHash) {
        const duplicateOf = findDuplicateFilename(perceptualHash, existingRows);
        if (duplicateOf) {
          errors.push(
            `${file.name}: duplicate of ${duplicateOf} (same image)`
          );
          continue;
        }
      }

      const resource = await uploadImageToFolder(
        refFolder,
        buffer,
        file.name
      );

      const { data: row, error: insertError } = await supabase
        .from("project_references")
        .insert({
          project_id: project.id,
          filename: resource.filename,
          cloudinary_url: resource.secure_url,
          sort_order: sortOrder,
          perceptual_hash: perceptualHash,
        })
        .select("*")
        .single();

      if (insertError || !row) {
        errors.push(`${file.name}: ${insertError?.message ?? "DB insert failed"}`);
        continue;
      }

      existingFilenames.add(resource.filename);
      existingRows.push({
        filename: resource.filename,
        perceptual_hash: perceptualHash,
      });
      uploaded.push(row as ProjectReference);
      sortOrder += 1;
    } catch (err) {
      errors.push(
        `${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`
      );
    }
  }

  if (uploaded.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const { data: references } = await supabase
    .from("project_references")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({
    uploaded: uploaded.length,
    errors,
    references: (references ?? []) as ProjectReference[],
  });
}
