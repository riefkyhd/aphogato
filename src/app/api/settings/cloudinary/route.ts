import "server-only";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import {
  getCloudinarySettings,
  setDefaultCloudinaryAccountId,
} from "@/lib/cloudinary/settings";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const settings = await getCloudinarySettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load Cloudinary settings",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  let body: { defaultAccountId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const defaultAccountId = body.defaultAccountId?.trim();
  if (!defaultAccountId) {
    return NextResponse.json(
      { error: "defaultAccountId is required" },
      { status: 400 }
    );
  }

  try {
    await setDefaultCloudinaryAccountId(defaultAccountId);
    const settings = await getCloudinarySettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to update Cloudinary settings",
      },
      { status: 400 }
    );
  }
}
