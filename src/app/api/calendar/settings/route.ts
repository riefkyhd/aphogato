import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { deleteGoogleRefreshToken } from "@/lib/calendar/googleSettings";

export const runtime = "nodejs";

export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    await deleteGoogleRefreshToken();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to disconnect Google";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
