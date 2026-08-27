import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { withErrorHandler } from "@/lib/api/logError";
import { buildFinanceBreakdown } from "@/lib/finance/breakdown";
import { buildFinanceSummary } from "@/lib/finance/summary";
import type { ExpenseEntry, IncomeEntry } from "@/lib/types";

export const runtime = "nodejs";

export const GET = withErrorHandler("finance.summary", async (request: Request) => {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const monthParam = url.searchParams.get("month");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  const month =
    monthParam && monthParam !== "all"
      ? Number(monthParam)
      : null;

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  if (
    month !== null &&
    (!Number.isFinite(month) || month < 1 || month > 12)
  ) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const [incomeRes, expenseRes, eventsRes] = await Promise.all([
    supabase
      .from("income_entries")
      .select("*")
      .gte("entry_date", `${year}-01-01`)
      .lte("entry_date", `${year}-12-31`),
    supabase
      .from("expense_entries")
      .select("*")
      .gte("entry_date", `${year}-01-01`)
      .lte("entry_date", `${year}-12-31`),
    supabase
      .from("events")
      .select("id, title, shoot_date")
      .order("shoot_date", { ascending: false }),
  ]);

  if (incomeRes.error) {
    return NextResponse.json({ error: incomeRes.error.message }, { status: 500 });
  }
  if (expenseRes.error) {
    return NextResponse.json(
      { error: expenseRes.error.message },
      { status: 500 }
    );
  }
  if (eventsRes.error) {
    return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
  }

  const income = (incomeRes.data ?? []).map((r) => ({
    ...(r as IncomeEntry),
    amount: Number(r.amount),
  }));
  const expenses = (expenseRes.data ?? []).map((r) => ({
    ...(r as ExpenseEntry),
    amount: Number(r.amount),
  }));
  const events = eventsRes.data ?? [];

  const summary = buildFinanceSummary(year, income, expenses);
  const breakdown = buildFinanceBreakdown(
    year,
    month,
    income,
    expenses,
    events
  );

  return NextResponse.json({ ...summary, breakdown });
});
