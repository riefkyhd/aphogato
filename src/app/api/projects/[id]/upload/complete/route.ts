import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { deleteCloudinaryImageByUrl } from "@/lib/cloudinary";
import {
  cloudinaryResourceFilename,
  isCloudinaryUrlForPublicId,
} from "@/lib/cloudinary/signedDirectUpload";
import {
  computeHashFromCloudinaryUrl,
  findDuplicateFilename,
  type ImageHashRow,
} from "@/lib/images/duplicateDetection";
import { extractShotAt } from "@/lib/images/extractShotAt";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";

type CompleteBody = {
  publicId?: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: CompleteBody;
  try {
    body = (await request.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const publicId = body.publicId?.trim() ?? "";
  const secureUrl = body.secureUrl?.trim() ?? "";
  if (!publicId || !secureUrl) {
    return NextResponse.json(
      { error: "publicId and secureUrl are required" },
      { status: 400 }
    );
  }

  if (!isCloudinaryUrlForPublicId(secureUrl, publicId)) {
    return NextResponse.json({ error: "Invalid Cloudinary upload" }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, cloudinary_folder")
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const normalizedFolder = project.cloudinary_folder.replace(/^\/+|\/+$/g, "");
  if (!publicId.startsWith(`${normalizedFolder}/`)) {
    return NextResponse.json({ error: "Upload folder mismatch" }, { status: 400 });
  }

  const filename = cloudinaryResourceFilename(publicId, body.format);

  const { data: existingPhotos } = await supabase
    .from("photos")
    .select("filename, perceptual_hash")
    .eq("project_id", project.id);

  const existingRows: ImageHashRow[] = (existingPhotos ?? []).map((p) => ({
    filename: p.filename as string,
    perceptual_hash: (p.perceptual_hash as string | null) ?? null,
  }));

  if (existingRows.some((row) => row.filename === filename)) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup for duplicate filename race.
    }
    return NextResponse.json(
      { error: `${filename}: already in this project` },
      { status: 400 }
    );
  }

  const perceptualHash = await computeHashFromCloudinaryUrl(secureUrl);
  if (perceptualHash) {
    const duplicateOf = findDuplicateFilename(perceptualHash, existingRows);
    if (duplicateOf) {
      try {
        await deleteCloudinaryImageByUrl(secureUrl);
      } catch {
        // Best-effort cleanup for perceptual duplicate.
      }
      return NextResponse.json(
        { error: `${filename}: duplicate of ${duplicateOf} (same image)` },
        { status: 400 }
      );
    }
  }

  const shotAt = await extractShotAt(publicId, filename);

  const { data: row, error: insertError } = await supabase
    .from("photos")
    .insert({
      project_id: project.id,
      filename,
      cloudinary_url: secureUrl,
      is_selected: false,
      perceptual_hash: perceptualHash,
      shot_at: shotAt,
    })
    .select("*")
    .single();

  if (insertError || !row) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup when DB insert fails.
    }
    return NextResponse.json(
      { error: insertError?.message ?? "DB insert failed" },
      { status: 500 }
    );
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    uploaded: 1,
    errors: [] as string[],
    photos: (photos ?? []) as Photo[],
  });
}
