import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { ensureClientByName } from "@/lib/clients/ensureClientByName";
import type { Client } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as Client[]);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
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

  try {
    await ensureClientByName(supabase, name);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save client" },
      { status: 500 }
    );
  }

  const { data: existing } = await supabase
    .from("clients")
    .select("*")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Failed to save client" }, { status: 500 });
  }

  const patch: Record<string, string | null> = {};
  if (body.phone !== undefined) patch.phone = body.phone.trim() || null;
  if (body.email !== undefined) patch.email = body.email.trim() || null;
  if (body.notes !== undefined) patch.notes = body.notes.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(existing as Client);
  }

  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update client" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as Client);
}
