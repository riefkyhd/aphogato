import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { normalizeExpense } from "@/lib/finance/normalize";
import { resolveExpenseLinks } from "@/lib/finance/resolveExpenseLinks";
import { parseExpenseBody } from "@/lib/finance/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const eventId = url.searchParams.get("event_id");
  const projectId = url.searchParams.get("project_id");

  let query = supabase
    .from("expense_entries")
    .select("*")
    .order("entry_date", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  } else if (projectId) {
    query = query.eq("project_id", projectId);
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

  return NextResponse.json((data ?? []).map(normalizeExpense));
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

  const parsed = parseExpenseBody(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  const linked = await resolveExpenseLinks(supabase, parsed.data);

  const { data, error } = await supabase
    .from("expense_entries")
    .insert(linked)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create expense" },
      { status: 500 }
    );
  }

  return NextResponse.json(normalizeExpense(data));
}
