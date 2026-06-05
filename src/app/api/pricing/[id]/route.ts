import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import type { PriceListItem } from "@/lib/types";

export const runtime = "nodejs";

function normalizeItem(row: Record<string, unknown>): PriceListItem {
  return {
    ...(row as unknown as PriceListItem),
    amount: Number(row.amount),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    name?: string;
    amount?: number;
    category?: string | null;
    notes?: string | null;
    sort_order?: number;
    active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }
    data.amount = amount;
  }
  if (body.category !== undefined) {
    data.category = body.category?.trim() || null;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes?.trim() || null;
  }
  if (body.sort_order !== undefined) data.sort_order = body.sort_order;
  if (body.active !== undefined) data.active = Boolean(body.active);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("price_list_items")
    .update(data)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeItem(row as Record<string, unknown>));
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { error } = await supabase
    .from("price_list_items")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
