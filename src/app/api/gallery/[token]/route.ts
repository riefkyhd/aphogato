import { NextResponse } from "next/server";
import { loadGalleryByToken } from "@/lib/gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const data = await loadGalleryByToken(params.token);
    if (!data) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load gallery" },
      { status: 500 }
    );
  }
}
