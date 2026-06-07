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
import type { ProjectReference } from "@/lib/types";

export const runtime = "nodejs";

type CompleteBody = {
  publicId?: string;
  secureUrl?: string;
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

  const refFolder = `${project.cloudinary_folder.replace(/^\/+|\/+$/g, "")}/references`;
  if (!publicId.startsWith(`${refFolder}/`)) {
    return NextResponse.json({ error: "Upload folder mismatch" }, { status: 400 });
  }

  const filename = cloudinaryResourceFilename(publicId, body.format);

  const { data: existingRefs } = await supabase
    .from("project_references")
    .select("filename, sort_order, perceptual_hash")
    .eq("project_id", project.id);

  const existingRows: ImageHashRow[] = (existingRefs ?? []).map((r) => ({
    filename: r.filename as string,
    perceptual_hash: (r.perceptual_hash as string | null) ?? null,
  }));

  if (existingRows.some((row) => row.filename === filename)) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup.
    }
    return NextResponse.json(
      { error: `${filename}: already in moodboard` },
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
        // Best-effort cleanup.
      }
      return NextResponse.json(
        { error: `${filename}: duplicate of ${duplicateOf} (same image)` },
        { status: 400 }
      );
    }
  }

  const baseSortOrder =
    (existingRefs ?? []).reduce(
      (max, r) => Math.max(max, r.sort_order ?? 0),
      -1
    ) + 1;

  const { error: insertError } = await supabase
    .from("project_references")
    .insert({
      project_id: project.id,
      filename,
      cloudinary_url: secureUrl,
      sort_order: baseSortOrder,
      perceptual_hash: perceptualHash,
    });

  if (insertError) {
    try {
      await deleteCloudinaryImageByUrl(secureUrl);
    } catch {
      // Best-effort cleanup.
    }
    return NextResponse.json(
      { error: insertError.message ?? "DB insert failed" },
      { status: 500 }
    );
  }

  const { data: references } = await supabase
    .from("project_references")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({
    uploaded: 1,
    errors: [] as string[],
    references: (references ?? []) as ProjectReference[],
  });
}
