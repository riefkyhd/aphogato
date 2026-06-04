import { NextResponse } from "next/server";
import { syncEventToGoogle } from "@/lib/calendar/googleCalendar";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("shoot_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const row of events ?? []) {
    const event = row as CalendarEvent;
    try {
      const { google_event_id } = await syncEventToGoogle(event);
      const synced_at = new Date().toISOString();
      await supabase
        .from("events")
        .update({ google_event_id, synced_at })
        .eq("id", event.id);
      synced += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      errors.push(`${event.title}: ${msg}`);
      if (msg.includes("not connected")) break;
    }
  }

  const { data: updated } = await supabase
    .from("events")
    .select("*")
    .order("shoot_date", { ascending: true });

  return NextResponse.json({
    synced,
    errors,
    events: (updated ?? []) as CalendarEvent[],
  });
}
