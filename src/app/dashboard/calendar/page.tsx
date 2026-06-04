import { CalendarClient } from "@/app/dashboard/calendar/CalendarClient";
import { isGoogleCalendarConnected } from "@/lib/calendar/googleSettings";
import { createServerSupabase } from "@/lib/supabase/server";
import { normalizeExpense, normalizeIncome } from "@/lib/finance/normalize";
import type { CalendarEvent, ExpenseEntry, IncomeEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createServerSupabase();

  const [eventsRes, projectsRes, incomeRes, expensesRes, isGoogleConnected] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .order("shoot_date", { ascending: true }),
      supabase
        .from("projects")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase.from("income_entries").select("*").not("event_id", "is", null),
      supabase
        .from("expense_entries")
        .select("*")
        .order("entry_date", { ascending: false }),
      isGoogleCalendarConnected(),
    ]);

  const initialEvents = (eventsRes.data ?? []) as CalendarEvent[];
  const projects = projectsRes.data ?? [];
  const incomeByEventId: Record<string, IncomeEntry> = {};
  for (const row of incomeRes.data ?? []) {
    const entry = normalizeIncome(row);
    if (entry.event_id) {
      incomeByEventId[entry.event_id] = entry;
    }
  }

  const initialExpenses = (expensesRes.data ?? []).map((row) =>
    normalizeExpense(row)
  ) as ExpenseEntry[];

  return (
    <CalendarClient
      initialEvents={initialEvents}
      projects={projects}
      initialIncomeByEventId={incomeByEventId}
      initialExpenses={initialExpenses}
      isGoogleConnected={isGoogleConnected}
    />
  );
}
