import { NextResponse } from "next/server";
import { loadTodayEvents } from "@/lib/calendar/loadTodayEvents";
import { getTodayDateString } from "@/lib/calendar/todayEvents";
import { requireAuth } from "@/lib/api/requireAuth";
import { withErrorHandler } from "@/lib/api/logError";

export const runtime = "nodejs";

export const GET = withErrorHandler("calendar.events.today", async () => {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const events = await loadTodayEvents(auth.supabase);

  return NextResponse.json({
    date: getTodayDateString(),
    events,
  });
});
