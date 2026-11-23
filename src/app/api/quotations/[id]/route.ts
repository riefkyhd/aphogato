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

  let { data, error } = await supabase
    .from("quotations")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  // Graceful fallback if database migrations have not yet been applied
  if (
    error &&
    (error.message?.includes("services") ||
      error.message?.includes("payment_terms") ||
      error.message?.includes("currency") ||
      error.message?.includes("schema cache") ||
      error.code === "PGRST204" ||
      error.code === "42703")
  ) {
    const legacyPayload = { ...payload };
    delete (legacyPayload as Record<string, unknown>).services;
    delete (legacyPayload as Record<string, unknown>).payment_terms;
    delete (legacyPayload as Record<string, unknown>).currency;
    delete (legacyPayload as Record<string, unknown>).exchange_rate_to_idr;
    delete (legacyPayload as Record<string, unknown>).exchange_rate_date;
    delete (legacyPayload as Record<string, unknown>).total_idr;

    const retry = await supabase
      .from("quotations")
      .update(legacyPayload)
      .eq("id", params.id)
      .select("*")
      .single();

    data = retry.data;
    error = retry.error;
  }

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
