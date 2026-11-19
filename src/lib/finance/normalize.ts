import type { ExpenseEntry, IncomeEntry } from "@/lib/types";

export function normalizeIncome(row: {
  id: string;
  event_id: string | null;
  entry_date: string;
  amount: string | number;
  currency: string;
  exchange_rate_to_idr?: string | number | null;
  exchange_rate_date?: string | null;
  original_amount?: string | number | null;
  client_name: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}): IncomeEntry {
  return {
    ...row,
    amount: Number(row.amount),
    exchange_rate_to_idr:
      row.exchange_rate_to_idr != null ? Number(row.exchange_rate_to_idr) : 1,
    exchange_rate_date: row.exchange_rate_date ?? null,
    original_amount:
      row.original_amount != null ? Number(row.original_amount) : null,
  };
}

export function normalizeExpense(row: {
  id: string;
  event_id: string | null;
  project_id?: string | null;
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
    project_id: row.project_id ?? null,
    amount: Number(row.amount),
  };
}
