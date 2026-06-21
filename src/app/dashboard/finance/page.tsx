import { Suspense } from "react";
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
  const { buildFinanceBreakdown } = await import("@/lib/finance/breakdown");
  const { normalizeIncome, normalizeExpense } = await import(
    "@/lib/finance/normalize"
  );

  const income = (incomeRes.data ?? []).map((r) => normalizeIncome(r));
  const expenses = (expenseRes.data ?? []).map((r) => normalizeExpense(r));
  const events = (eventsRes.data ?? []) as Pick<
    CalendarEvent,
    "id" | "title" | "shoot_date" | "client_name" | "project_id"
  >[];
  const projects = projectsRes.data ?? [];
  const summary = buildFinanceSummary(year, income, expenses);
  const breakdown = buildFinanceBreakdown(
    year,
    new Date().getMonth() + 1,
    income,
    expenses,
    events
  );

  return (
    <Suspense fallback={null}>
      <FinanceClient
        initialYear={year}
        initialSummary={{ ...summary, breakdown }}
        initialIncome={income}
        initialExpenses={expenses}
        events={events}
        projects={projects}
      />
    </Suspense>
  );
}
