import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/api/requireAuth";
import { ensureClientByName } from "@/lib/clients/ensureClientByName";
import { parseMaxPhotoSelectionInput } from "@/lib/photoSelectionLimit";
import { parseFaceSearchEnabledInput } from "@/lib/faces/validation";
import { resolveUniqueCloudinaryFolder } from "@/lib/resolveCloudinaryFolder";
import { getCloudinaryAccount } from "@/lib/cloudinary/accounts";
import { getDefaultCloudinaryAccountId } from "@/lib/cloudinary/settings";
import { isImageKitConfigured } from "@/lib/imagekit/config";
import { normalizeStorageProvider } from "@/lib/storage/provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    name?: string;
    client_name?: string;
    max_photo_selection?: unknown;
    cloudinary_account?: string;
    storage_provider?: string;
    face_search_enabled?: unknown;
  };
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

  const faceSearchParsed = parseFaceSearchEnabledInput(body.face_search_enabled);
  if (!faceSearchParsed.ok) {
    return NextResponse.json({ error: faceSearchParsed.error }, { status: 400 });
  }

  const gallery_token = nanoid();
  const clientName = body.client_name?.trim() || null;
  const storage_provider = normalizeStorageProvider(body.storage_provider);

  if (storage_provider === "imagekit" && !isImageKitConfigured()) {
    return NextResponse.json(
      { error: "ImageKit is not configured in the environment" },
      { status: 400 }
    );
  }

  let cloudinary_account: string;
  try {
    if (storage_provider === "imagekit") {
      cloudinary_account = "default";
    } else {
      const requested = body.cloudinary_account?.trim();
      cloudinary_account = requested
        ? getCloudinaryAccount(requested).id
        : await getDefaultCloudinaryAccountId();
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Invalid Cloudinary account",
      },
      { status: 400 }
    );
  }

  try {
    await ensureClientByName(supabase, clientName);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to save client to book",
      },
      { status: 500 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name,
      client_name: clientName,
      cloudinary_folder,
      cloudinary_account,
      storage_provider,
      gallery_token,
      status: "pending",
      max_photo_selection: maxParsed.value,
      face_search_enabled: faceSearchParsed.value,
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
