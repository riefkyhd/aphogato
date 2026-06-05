import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { parseSocialAccountsInput } from "@/lib/clients/socialAccounts";
import type { Client, ClientSocialAccount } from "@/lib/types";

function normalizeClientRow(row: Client): Client {
  return {
    ...row,
    social_accounts: Array.isArray(row.social_accounts) ? row.social_accounts : [],
  };
}

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

  const data: Record<string, string | null | ClientSocialAccount[]> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.phone !== undefined) {
    data.phone =
      typeof body.phone === "string" ? body.phone.trim() || null : null;
  }
  if (body.email !== undefined) {
    data.email =
      typeof body.email === "string" ? body.email.trim() || null : null;
  }
  if (body.notes !== undefined) {
    data.notes =
      typeof body.notes === "string" ? body.notes.trim() || null : null;
  }
  if (body.social_accounts !== undefined) {
    const socialParsed = parseSocialAccountsInput(body.social_accounts);
    if (!Array.isArray(socialParsed)) {
      return NextResponse.json({ error: socialParsed.error }, { status: 400 });
    }
    data.social_accounts = socialParsed;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A client with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeClientRow(row as Client));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { error } = await supabase.from("clients").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
