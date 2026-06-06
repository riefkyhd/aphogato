import { NextResponse } from "next/server";
import { loadTodayEvents } from "@/lib/calendar/loadTodayEvents";
import { getTodayDateString } from "@/lib/calendar/todayEvents";
import { requireAuth } from "@/lib/api/requireAuth";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const events = await loadTodayEvents(auth.supabase);

  return NextResponse.json({
    date: getTodayDateString(),
    events,
  });
}
