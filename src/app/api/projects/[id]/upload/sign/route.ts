import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { buildPhotoFilename } from "@/lib/cloudinary/filenames";
import { buildSignedCloudinaryUpload } from "@/lib/cloudinary/signedDirectUpload";
import { getProjectCloudinaryAccountId } from "@/lib/cloudinary/accounts";
import { buildImageKitUploadAuth } from "@/lib/imagekit/auth";
import { assertImageKitConfigured } from "@/lib/imagekit/config";
import { createDriveResumableUploadSession } from "@/lib/gdrive/client";
import { getProjectStorageProvider } from "@/lib/storage/provider";
import { validateImageUploadMeta } from "@/lib/imageUploadValidation";
import type { PhotoStage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    filename?: string;
    mimeType?: string;
    size?: number;
    stage?: PhotoStage;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const filename = body.filename?.trim() ?? "";
  const mimeType = body.mimeType ?? "";
  const size = body.size ?? 0;
  const stage: PhotoStage = body.stage === "final" ? "final" : "proof";

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, cloudinary_folder, cloudinary_account, storage_provider, gdrive_folder_id, gdrive_finals_folder_id"
    )
    .eq("id", params.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const storageProvider = getProjectStorageProvider(project);

  // If GDrive, we allow large files (e.g. 50MB+) without strict 20MB limit
  if (storageProvider !== "gdrive") {
    const validationError = validateImageUploadMeta(filename, mimeType, size);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  const storedFilename = buildPhotoFilename(filename);
  const { data: existing } = await supabase
    .from("photos")
    .select("filename")
    .eq("project_id", project.id)
    .eq("filename", storedFilename)
    .eq("stage", stage)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `${storedFilename}: already in this project (${stage})` },
      { status: 400 }
    );
  }

  if (storageProvider === "gdrive") {
    try {
      const folderId =
        stage === "final"
          ? project.gdrive_finals_folder_id
          : project.gdrive_folder_id;

      if (!folderId) {
        return NextResponse.json(
          {
            error: `Please set a Google Drive ${stage === "final" ? "Finals" : "Proofs"} folder ID first.`,
          },
          { status: 400 }
        );
      }

      const origin = request.headers.get("origin") ?? undefined;
      const { uploadUrl } = await createDriveResumableUploadSession(
        folderId,
        storedFilename,
        mimeType || "image/jpeg",
        origin
      );

      return NextResponse.json({
        provider: "gdrive" as const,
        uploadUrl,
        fileName: storedFilename,
        stage,
      });
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Could not prepare Drive upload",
        },
        { status: 500 }
      );
    }
  }

  if (storageProvider === "imagekit") {
    try {
      assertImageKitConfigured();
      const auth = buildImageKitUploadAuth();
      const folder = `/${project.cloudinary_folder.replace(/^\/+|\/+$/g, "")}`;
      return NextResponse.json({
        provider: "imagekit" as const,
        ...auth,
        folder,
        fileName: storedFilename,
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : "Could not prepare upload",
        },
        { status: 500 }
      );
    }
  }

  try {
    const signed = buildSignedCloudinaryUpload(
      project.cloudinary_folder,
      filename,
      getProjectCloudinaryAccountId(project)
    );
    return NextResponse.json({ provider: "cloudinary" as const, ...signed });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not prepare upload",
      },
      { status: 500 }
    );
  }
}
