import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import {
  draftToInsertPayload,
  normalizeQuotation,
} from "@/lib/quotations/db";
import type { QuotationDraft } from "@/lib/quotations/types";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .order("quote_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((row) =>
      normalizeQuotation(row as Record<string, unknown>)
    )
  );
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    draft?: QuotationDraft;
    parentId?: string | null;
    revision?: number;
  };
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
    payload = draftToInsertPayload(body.draft, {
      parentId: body.parentId ?? null,
      revision: body.revision ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid draft" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("quotations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    const message =
      error.code === "23505"
        ? "Quote number already saved. Open it from the archive or use a new number."
        : error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    normalizeQuotation(data as Record<string, unknown>)
  );
}
