import { NextResponse } from "next/server";
import { getTodayDateString } from "@/lib/calendar/todayEvents";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
