import { NextResponse } from "next/server";
import { deleteEventFromGoogle } from "@/lib/calendar/googleCalendar";
import { parseEventPatchBody } from "@/lib/calendar/eventValidation";
import { requireAuth } from "@/lib/api/requireAuth";
import type { CalendarEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseEventPatchBody(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? "Invalid body" }, {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("events")
    .update(parsed.data)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(data as CalendarEvent);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("id, google_event_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.google_event_id) {
    try {
      await deleteEventFromGoogle(event.google_event_id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google Calendar delete failed";
      if (message.includes("not connected")) {
        // Allow local delete if Google was disconnected
      } else {
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }
  }

  const { error } = await supabase.from("events").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
