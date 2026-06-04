import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { normalizeIncome } from "@/lib/finance/normalize";
import { parseIncomePatchBody } from "@/lib/finance/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseIncomePatchBody(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("income_entries")
    .update(parsed.data)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeIncome(data));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
