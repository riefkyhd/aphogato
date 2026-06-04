import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { buildFinanceSummary } from "@/lib/finance/summary";
import type { ExpenseEntry, IncomeEntry } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const [incomeRes, expenseRes] = await Promise.all([
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

  const income = (incomeRes.data ?? []).map((r) => ({
    ...(r as IncomeEntry),
    amount: Number(r.amount),
  }));
  const expenses = (expenseRes.data ?? []).map((r) => ({
    ...(r as ExpenseEntry),
    amount: Number(r.amount),
  }));

  return NextResponse.json(buildFinanceSummary(year, income, expenses));
}
