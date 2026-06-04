import type { ExpenseEntry, FinanceMonthSummary, IncomeEntry } from "@/lib/types";

function toNumber(amount: string | number): number {
  return typeof amount === "number" ? amount : Number(amount);
}

export function buildFinanceSummary(
  year: number,
  income: IncomeEntry[],
  expenses: ExpenseEntry[]
): {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  months: FinanceMonthSummary[];
} {
  const months: FinanceMonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expenses: 0,
    net: 0,
  }));

  for (const row of income) {
    const d = row.entry_date;
    const y = Number(d.slice(0, 4));
    const m = Number(d.slice(5, 7));
    if (y !== year || m < 1 || m > 12) continue;
    const amt = toNumber(row.amount);
    months[m - 1].income += amt;
  }

  for (const row of expenses) {
    const d = row.entry_date;
    const y = Number(d.slice(0, 4));
    const m = Number(d.slice(5, 7));
    if (y !== year || m < 1 || m > 12) continue;
    const amt = toNumber(row.amount);
    months[m - 1].expenses += amt;
  }

  for (const bucket of months) {
    bucket.net = bucket.income - bucket.expenses;
  }

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);

  return {
    year,
    totalIncome,
    totalExpenses,
    net: totalIncome - totalExpenses,
    months,
  };
}

export function filterEntriesByMonth<
  T extends { entry_date: string },
>(entries: T[], year: number, month: number): T[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return entries.filter((e) => e.entry_date.startsWith(prefix));
}
