import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { uploadImageToFolder } from "@/lib/cloudinary";
import {
  computeHashFromBuffer,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { extractShotAt } from "@/lib/images/extractShotAt";
import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_FILES_PER_REQUEST,
} from "@/lib/imageUploadLimits";
import { isAllowedImageBuffer } from "@/lib/security/imageBytes";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

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
  if (entries.length > MAX_IMAGE_UPLOAD_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMAGE_UPLOAD_FILES_PER_REQUEST} files per upload` },
      { status: 400 }
    );
  }

  const { data: existingPhotos } = await supabase
    .from("photos")
    .select("filename, perceptual_hash")
    .eq("project_id", project.id);

  const existingRows: ImageHashRow[] = (existingPhotos ?? []).map((p) => ({
    filename: p.filename as string,
    perceptual_hash: (p.perceptual_hash as string | null) ?? null,
  }));
  const existingFilenames = new Set(existingRows.map((p) => p.filename));

  const uploaded: Photo[] = [];
  const errors: string[] = [];

  for (const file of entries as File[]) {
    if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
      errors.push(`${file.name}: unsupported file type`);
      continue;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
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
        project.cloudinary_folder,
        buffer,
        file.name
      );

      const shotAt = await extractShotAt(resource.public_id, resource.filename);

      const { data: row, error: insertError } = await supabase
        .from("photos")
        .insert({
          project_id: project.id,
          filename: resource.filename,
          cloudinary_url: resource.secure_url,
          is_selected: false,
          perceptual_hash: perceptualHash,
          shot_at: shotAt,
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
