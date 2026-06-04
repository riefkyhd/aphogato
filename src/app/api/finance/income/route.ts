import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { normalizeIncome } from "@/lib/finance/normalize";
import { parseIncomeBody } from "@/lib/finance/validation";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const eventId = url.searchParams.get("event_id");

  let query = supabase
    .from("income_entries")
    .select("*")
    .order("entry_date", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  } else if (year) {
    const y = Number(year);
    if (!Number.isFinite(y)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    query = query
      .gte("entry_date", `${y}-01-01`)
      .lte("entry_date", `${y}-12-31`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map(normalizeIncome);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseIncomeBody(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  if (parsed.data.event_id) {
    const { data: existing } = await supabase
      .from("income_entries")
      .select("id")
      .eq("event_id", parsed.data.event_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("income_entries")
        .update(parsed.data)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to update income" },
          { status: 500 }
        );
      }
      return NextResponse.json(normalizeIncome(data));
    }
  }

  const { data, error } = await supabase
    .from("income_entries")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create income" },
      { status: 500 }
    );
  }

  return NextResponse.json(normalizeIncome(data));
}
