import type { ExpenseEntry, IncomeEntry } from "@/lib/types";

export function normalizeIncome(row: {
  id: string;
  event_id: string | null;
  entry_date: string;
  amount: string | number;
  currency: string;
  client_name: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}): IncomeEntry {
  return {
    ...row,
    amount: Number(row.amount),
  };
}

export function normalizeExpense(row: {
  id: string;
  event_id: string | null;
  entry_date: string;
  amount: string | number;
  currency: string;
  category: string;
  description: string | null;
  notes: string | null;
  created_at: string;
}): ExpenseEntry {
  return {
    ...row,
    amount: Number(row.amount),
  };
}
