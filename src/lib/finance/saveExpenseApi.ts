import { normalizeExpense } from "@/lib/finance/normalize";
import type { ExpenseEntry } from "@/lib/types";

export type SaveExpenseResult =
  | { ok: true; entry: ExpenseEntry }
  | { ok: false; error: string };

export async function saveExpenseApi(
  payload: Record<string, unknown>,
  editingId?: string | null
): Promise<SaveExpenseResult> {
  const url = editingId
    ? `/api/finance/expenses/${editingId}`
    : "/api/finance/expenses";
  try {
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof json.error === "string" ? json.error : "Failed to save expense",
      };
    }
    return { ok: true, entry: normalizeExpense(json) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save",
    };
  }
}

export function buildLinkedExpensePayload({
  amount,
  category,
  entryDate,
  eventId,
  projectId,
}: {
  amount: number;
  category: string;
  entryDate: string;
  eventId?: string;
  projectId?: string;
}): Record<string, unknown> {
  return {
    amount,
    category,
    entry_date: entryDate,
    event_id: eventId || null,
    project_id: projectId || null,
    description: null,
    notes: null,
  };
}
