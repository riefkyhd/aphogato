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

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("price_list_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((row) => normalizeItem(row as Record<string, unknown>))
  );
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: {
    name?: string;
    amount?: number;
    category?: string;
    notes?: string;
    sort_order?: number;
    active?: boolean;
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

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const { count } = await supabase
    .from("price_list_items")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("price_list_items")
    .insert({
      name,
      amount,
      category: body.category?.trim() || null,
      notes: body.notes?.trim() || null,
      sort_order: body.sort_order ?? (count ?? 0),
      active: body.active !== false,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create item" },
      { status: 500 }
    );
  }

  return NextResponse.json(normalizeItem(data as Record<string, unknown>));
}
