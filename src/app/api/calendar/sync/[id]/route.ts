import { NextResponse } from "next/server";
import { syncEventToGoogle } from "@/lib/calendar/googleCalendar";
import { requireAuth } from "@/lib/api/requireAuth";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const { google_event_id } = await syncEventToGoogle(
      event as CalendarEvent
    );
    const synced_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("events")
      .update({ google_event_id, synced_at })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, google_event_id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google Calendar sync failed";
    if (message.includes("not connected")) {
      return NextResponse.json({ ok: false, error: "Google Calendar not connected" });
    }
    return NextResponse.json({ ok: false, error: message });
  }
}
