import { FinanceClient } from "@/app/dashboard/finance/FinanceClient";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const supabase = createServerSupabase();
  const year = new Date().getFullYear();

  const [incomeRes, expenseRes, eventsRes, projectsRes] = await Promise.all([
    supabase
      .from("income_entries")
      .select("*")
      .gte("entry_date", `${year}-01-01`)
      .lte("entry_date", `${year}-12-31`)
      .order("entry_date", { ascending: false }),
    supabase
      .from("expense_entries")
      .select("*")
      .gte("entry_date", `${year}-01-01`)
      .lte("entry_date", `${year}-12-31`)
      .order("entry_date", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, shoot_date, client_name, project_id")
      .order("shoot_date", { ascending: false }),
    supabase.from("projects").select("id, name").order("name", { ascending: true }),
  ]);

  // Server-side load via supabase directly (avoid self-fetch without URL)
  const { buildFinanceSummary } = await import("@/lib/finance/summary");
  const { normalizeIncome, normalizeExpense } = await import(
    "@/lib/finance/normalize"
  );

  const income = (incomeRes.data ?? []).map((r) => normalizeIncome(r));
  const expenses = (expenseRes.data ?? []).map((r) => normalizeExpense(r));
  const summary = buildFinanceSummary(year, income, expenses);
  const events = (eventsRes.data ?? []) as Pick<
    CalendarEvent,
    "id" | "title" | "shoot_date" | "client_name" | "project_id"
  >[];
  const projects = projectsRes.data ?? [];

  return (
    <FinanceClient
      initialYear={year}
      initialSummary={summary}
      initialIncome={income}
      initialExpenses={expenses}
      events={events}
      projects={projects}
    />
  );
}
