import type { ExpenseEntry } from "@/lib/types";

/** Expenses tied to a project directly or via a linked calendar event. */
export function filterExpensesForProject(
  expenses: ExpenseEntry[],
  projectId: string,
  eventIdsForProject: Set<string>
): ExpenseEntry[] {
  return expenses.filter(
    (e) =>
      e.project_id === projectId ||
      (e.event_id != null && eventIdsForProject.has(e.event_id))
  );
}

export function filterExpensesForEvent(
  expenses: ExpenseEntry[],
  eventId: string
): ExpenseEntry[] {
  return expenses.filter((e) => e.event_id === eventId);
}

export function sumExpenseAmounts(expenses: ExpenseEntry[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
