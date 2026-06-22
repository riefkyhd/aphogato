import { buildFinanceBreakdown } from "@/lib/finance/breakdown";
import type { FinanceEventOption } from "@/lib/finance/financeOptions";
import { buildFinanceSummary } from "@/lib/finance/summary";
import type { ExpenseEntry, FinanceSummary, IncomeEntry } from "@/lib/types";

function sortByEntryDateDesc<T extends { entry_date: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
}

function entryYear(entryDate: string): number {
  return Number(entryDate.slice(0, 4));
}

export function syncFinanceSummary(
  year: number,
  month: number | null,
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
  events: FinanceEventOption[]
): FinanceSummary {
  const base = buildFinanceSummary(year, income, expenses);
  const breakdown = buildFinanceBreakdown(year, month, income, expenses, events);
  return { ...base, breakdown };
}

export function upsertExpenseInYear(
  expenses: ExpenseEntry[],
  entry: ExpenseEntry,
  year: number
): ExpenseEntry[] {
  const without = expenses.filter((row) => row.id !== entry.id);
  if (entryYear(entry.entry_date) !== year) return without;
  return sortByEntryDateDesc([entry, ...without]);
}

export function removeExpenseById(
  expenses: ExpenseEntry[],
  id: string
): ExpenseEntry[] {
  return expenses.filter((row) => row.id !== id);
}

export function upsertIncomeInYear(
  income: IncomeEntry[],
  entry: IncomeEntry,
  year: number
): IncomeEntry[] {
  const without = income.filter((row) => row.id !== entry.id);
  if (entryYear(entry.entry_date) !== year) return without;
  return sortByEntryDateDesc([entry, ...without]);
}

export function removeIncomeById(income: IncomeEntry[], id: string): IncomeEntry[] {
  return income.filter((row) => row.id !== id);
}
