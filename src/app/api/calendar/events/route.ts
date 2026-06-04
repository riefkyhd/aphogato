import { NextResponse } from "next/server";
import {
  parseEventInsertBody,
} from "@/lib/calendar/eventValidation";
import { requireAuth } from "@/lib/api/requireAuth";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("shoot_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as CalendarEvent[]);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseEventInsertBody(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("events")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create event" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as CalendarEvent);
}
