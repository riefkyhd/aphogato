import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import {
  draftToInsertPayload,
  normalizeQuotation,
} from "@/lib/quotations/db";
import type { QuotationDraft } from "@/lib/quotations/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: { draft?: QuotationDraft };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.draft) {
    return NextResponse.json({ error: "draft is required" }, { status: 400 });
  }

  let payload;
  try {
    payload = draftToInsertPayload(body.draft);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid draft" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("quotations")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "Quote number already used by another saved quotation."
        : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }

  return NextResponse.json(
    normalizeQuotation(data as Record<string, unknown>)
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { error } = await supabase.from("quotations").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
