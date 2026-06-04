import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { normalizeExpense } from "@/lib/finance/normalize";
import { resolveExpenseLinks } from "@/lib/finance/resolveExpenseLinks";
import { parseExpensePatchBody } from "@/lib/finance/validation";

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

  const parsed = parseExpensePatchBody(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  const { data: existing } = await supabase
    .from("expense_entries")
    .select("event_id, project_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const merged = {
    event_id:
      parsed.data.event_id !== undefined
        ? parsed.data.event_id
        : existing.event_id,
    project_id:
      parsed.data.project_id !== undefined
        ? parsed.data.project_id
        : existing.project_id,
  };
  const linked = await resolveExpenseLinks(supabase, merged);
  const updatePayload = { ...parsed.data, ...linked };

  const { data, error } = await supabase
    .from("expense_entries")
    .update(updatePayload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeExpense(data));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { error } = await supabase
    .from("expense_entries")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
