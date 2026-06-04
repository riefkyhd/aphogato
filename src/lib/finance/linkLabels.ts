import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/finance/constants";
import type { ExpenseEntry } from "@/lib/types";

type EventRef = { id: string; title: string };
type ProjectRef = { id: string; name: string };

export function formatExpenseEntryLinks(
  row: ExpenseEntry,
  eventById: Map<string, EventRef>,
  projectById: Map<string, ProjectRef>
): string | null {
  const parts: string[] = [];
  if (row.event_id) {
    const ev = eventById.get(row.event_id);
    parts.push(ev ? ev.title : "Calendar event");
  }
  if (row.project_id) {
    const p = projectById.get(row.project_id);
    parts.push(p ? p.name : "Project");
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatExpensePrimary(row: ExpenseEntry): string {
  return (
    row.description ??
    EXPENSE_CATEGORY_LABELS[row.category as ExpenseCategory] ??
    row.category
  );
}
