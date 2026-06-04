import { NextResponse } from "next/server";
import { getTodayDateString } from "@/lib/calendar/todayEvents";
import { requireAuth } from "@/lib/api/requireAuth";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("shoot_date", today)
    .order("shoot_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    date: today,
    events: (data ?? []) as CalendarEvent[],
  });
}
