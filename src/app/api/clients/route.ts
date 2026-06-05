import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { findClientByName } from "@/lib/clients/findClientByName";
import { parseSocialAccountsInput } from "@/lib/clients/socialAccounts";
import type { Client } from "@/lib/types";

function normalizeClientRow(row: Client): Client {
  return {
    ...row,
    social_accounts: Array.isArray(row.social_accounts) ? row.social_accounts : [],
  };
}

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

  return NextResponse.json(
    ((data ?? []) as Client[]).map(normalizeClientRow)
  );
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
    social_accounts?: unknown;
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

  const socialParsed = parseSocialAccountsInput(body.social_accounts);
  if (!Array.isArray(socialParsed)) {
    return NextResponse.json({ error: socialParsed.error }, { status: 400 });
  }

  const payload = {
    name,
    phone: body.phone?.trim() || null,
    email: body.email?.trim() || null,
    notes: body.notes?.trim() || null,
    social_accounts: socialParsed,
  };

  const { data: created, error: insertError } = await supabase
    .from("clients")
    .insert(payload)
    .select("*")
    .single();

  if (!insertError && created) {
    return NextResponse.json(normalizeClientRow(created as Client));
  }

  if (insertError?.code !== "23505") {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create client" },
      { status: 500 }
    );
  }

  try {
    const existing = await findClientByName(supabase, name);
    if (!existing) {
      return NextResponse.json(
        { error: "Client already exists but could not be loaded" },
        { status: 500 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("clients")
      .update({
        phone: payload.phone,
        email: payload.email,
        notes: payload.notes,
        social_accounts: payload.social_accounts,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Failed to update existing client" },
        { status: 500 }
      );
    }

    return NextResponse.json(normalizeClientRow(updated as Client));
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to save client",
      },
      { status: 500 }
    );
  }
}
