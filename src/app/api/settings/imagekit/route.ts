import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import {
  getImageKitUrlEndpoint,
  isImageKitConfigured,
} from "@/lib/imagekit/config";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const configured = isImageKitConfigured();

  return NextResponse.json({
    configured,
    urlEndpoint: configured ? getImageKitUrlEndpoint() : null,
  });
}
