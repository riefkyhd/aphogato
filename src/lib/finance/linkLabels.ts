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

export function isGeneralExpense(row: ExpenseEntry): boolean {
  return !row.event_id && !row.project_id;
}

export function formatExpenseSecondary(
  row: ExpenseEntry,
  eventById: Map<string, EventRef>,
  projectById: Map<string, ProjectRef>
): string {
  const links = formatExpenseEntryLinks(row, eventById, projectById);
  if (links) return links;
  const category =
    EXPENSE_CATEGORY_LABELS[row.category as ExpenseCategory] ?? row.category;
  if (isGeneralExpense(row)) return `General · ${category}`;
  return category;
}
