import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import type { UserPreferencesPatch } from "@/lib/preferences/types";
import {
  getUserPreferences,
  patchUserPreferences,
} from "@/lib/preferences/userPreferences";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const preferences = await getUserPreferences(auth.supabase, auth.user.id);
    return NextResponse.json({ preferences });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  let body: UserPreferencesPatch;
  try {
    body = (await request.json()) as UserPreferencesPatch;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid preferences payload" }, { status: 400 });
  }

  try {
    const preferences = await patchUserPreferences(
      auth.supabase,
      auth.user.id,
      body
    );
    return NextResponse.json({ preferences });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
