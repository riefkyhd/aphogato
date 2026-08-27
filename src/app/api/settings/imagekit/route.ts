import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { withErrorHandler } from "@/lib/api/logError";
import {
  getImageKitUrlEndpoint,
  isImageKitConfigured,
} from "@/lib/imagekit/config";

export const runtime = "nodejs";

export const GET = withErrorHandler("settings.imagekit", async () => {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const configured = isImageKitConfigured();

  return NextResponse.json({
    configured,
    urlEndpoint: configured ? getImageKitUrlEndpoint() : null,
  });
});
