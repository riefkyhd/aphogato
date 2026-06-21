"use client";

import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import type { FinanceEventOption } from "@/lib/finance/financeOptions";
import { filterExpensesForEvent, sumExpenseAmounts } from "@/lib/finance/projectExpenses";
import { formatMoney } from "@/lib/finance/formatMoney";
import type { ExpenseEntry, IncomeEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EventFinanceDetail({
  eventId,
  events,
  income,
  expenses,
  showAmounts,
  onEditExpense,
}: {
  eventId: string;
  events: FinanceEventOption[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  showAmounts: boolean;
  onEditExpense: (entry: ExpenseEntry) => void;
}) {
  const event = events.find((row) => row.id === eventId);
  const eventIncome = income.find((row) => row.event_id === eventId) ?? null;
  const eventExpenses = useMemo(
    () => filterExpensesForEvent(expenses, eventId),
    [expenses, eventId]
  );
  const expenseTotal = sumExpenseAmounts(eventExpenses);
  const net = (eventIncome?.amount ?? 0) - expenseTotal;

  const categoryTotals = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const row of eventExpenses) {
      const category = row.category as ExpenseCategory;
      totals.set(category, (totals.get(category) ?? 0) + row.amount);
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [eventExpenses]);

  if (!event) return null;

  return (
    <section className="mb-6 border border-border bg-bg-secondary p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-label text-text-muted">
            Event finance
          </p>
          <h2 className="mt-1 text-[15px] text-text-primary">{event.title}</h2>
          <p className="text-[12px] text-text-secondary mt-0.5">
            {event.shoot_date
              ? format(parseISO(event.shoot_date), "EEEE, d MMMM yyyy")
              : "No shoot date"}
            {event.client_name ? ` · ${event.client_name}` : ""}
          </p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors shrink-0"
        >
          Open in Calendar →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] mt-4">
        <div className="border border-border bg-bg-primary/40 p-3">
          <p className="text-[10px] uppercase tracking-label text-text-muted">
            Income
          </p>
          <p className="mt-1 text-[15px] text-status-delivered tabular-nums">
            {eventIncome ? (
              <MaskedMoney amount={eventIncome.amount} visible={showAmounts} />
            ) : (
              <span className="text-text-muted text-[13px]">Not recorded</span>
            )}
          </p>
        </div>
        <div className="border border-border bg-bg-primary/40 p-3">
          <p className="text-[10px] uppercase tracking-label text-text-muted">
            Expenses
          </p>
          <p className="mt-1 text-[15px] text-status-editing tabular-nums">
            <MaskedMoney amount={expenseTotal} visible={showAmounts} />
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {eventExpenses.length} item{eventExpenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="border border-border bg-bg-primary/40 p-3">
          <p className="text-[10px] uppercase tracking-label text-text-muted">
            Net margin
          </p>
          <p
            className={cn(
              "mt-1 text-[15px] tabular-nums",
              net >= 0 ? "text-status-delivered" : "text-status-editing"
            )}
          >
            <MaskedMoney amount={net} visible={showAmounts} />
          </p>
          {eventIncome && eventIncome.amount > 0 && showAmounts ? (
            <p className="text-[11px] text-text-muted mt-0.5">
              {Math.round((net / eventIncome.amount) * 100)}% margin
            </p>
          ) : null}
        </div>
      </div>

      {categoryTotals.length > 0 ? (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-label text-text-muted mb-2">
            Expense breakdown
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryTotals.map(([category, amount]) => (
              <span
                key={category}
                className="text-[11px] border border-border px-2 py-1 text-text-secondary"
              >
                {EXPENSE_CATEGORY_LABELS[category] ?? category}
                {": "}
                {showAmounts ? formatMoney(amount) : "••••••"}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {eventExpenses.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {eventExpenses.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 text-[12px] border border-border/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-text-primary truncate">
                  {EXPENSE_CATEGORY_LABELS[row.category as ExpenseCategory] ??
                    row.category}
                  {row.description ? ` · ${row.description}` : ""}
                </p>
                <p className="text-text-muted text-[10px] mt-0.5">
                  {format(parseISO(row.entry_date), "MMM d, yyyy")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-text-primary">
                  <MaskedMoney amount={row.amount} visible={showAmounts} />
                </p>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-label text-text-muted hover:text-text-primary mt-0.5"
                  onClick={() => onEditExpense(row)}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[12px] text-text-secondary border-t border-border pt-4">
          No expenses linked to this event in the selected period.
        </p>
      )}
    </section>
  );
}
