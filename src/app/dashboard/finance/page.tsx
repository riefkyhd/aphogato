import { Suspense } from "react";
import { FinanceClient } from "@/app/dashboard/finance/FinanceClient";
import { FEATURES } from "@/lib/features";
import { FeatureDisabled } from "@/components/FeatureDisabled";
import { createServerSupabase } from "@/lib/supabase/server";
import { unwrapQuery } from "@/lib/api/supabaseQuery";
import { Skeleton } from "@/components/loading/Skeleton";
import type { CalendarEvent } from "@/lib/types";

function FinanceChartFallback() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading finance data"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  if (!FEATURES.finance) {
    return <FeatureDisabled label="Finance" />;
  }
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

  const incomeRows = unwrapQuery<Array<Parameters<typeof normalizeIncome>[0]>>(
    "finance.income",
    incomeRes
  );
  const expenseRows = unwrapQuery<Array<Parameters<typeof normalizeExpense>[0]>>(
    "finance.expenses",
    expenseRes
  );
  const eventRows = unwrapQuery<
    Pick<CalendarEvent, "id" | "title" | "shoot_date" | "client_name" | "project_id">[]
  >("finance.events", eventsRes);
  const projectRows = unwrapQuery<{ id: string; name: string }[]>(
    "finance.projects",
    projectsRes
  );

  const income = incomeRows.map((r) => normalizeIncome(r));
  const expenses = expenseRows.map((r) => normalizeExpense(r));
  const events = eventRows;
  const projects = projectRows;
  const summary = buildFinanceSummary(year, income, expenses);
  const breakdown = buildFinanceBreakdown(
    year,
    new Date().getMonth() + 1,
    income,
    expenses,
    events
  );

  return (
    <Suspense fallback={<FinanceChartFallback />}>
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
