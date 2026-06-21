"use client";

import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import { formatMoney } from "@/lib/finance/formatMoney";
import type { FinanceBreakdown, FinanceSummary } from "@/lib/types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function FinanceCharts({
  summary,
  breakdown,
  showAmounts,
}: {
  summary: FinanceSummary;
  breakdown: FinanceBreakdown;
  showAmounts: boolean;
}) {
  const maxMonthValue = Math.max(
    ...summary.months.flatMap((month) => [month.income, month.expenses]),
    1
  );

  const categoryRows = EXPENSE_CATEGORIES.map((category) => ({
    category,
    amount: breakdown.byCategory[category] ?? 0,
  }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const maxCategory = Math.max(...categoryRows.map((row) => row.amount), 1);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      <section className="border border-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
          Monthly cashflow
        </h2>
        <div className="flex items-end gap-1 h-40">
          {summary.months.map((month) => {
            const incomeHeight = (month.income / maxMonthValue) * 100;
            const expenseHeight = (month.expenses / maxMonthValue) * 100;
            const title = showAmounts
              ? `${MONTH_LABELS[month.month - 1]}: income ${formatMoney(month.income)}, expenses ${formatMoney(month.expenses)}, net ${formatMoney(month.net)}`
              : `${MONTH_LABELS[month.month - 1]}`;

            return (
              <div
                key={month.month}
                className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full"
                title={title}
              >
                <div className="flex items-end justify-center gap-0.5 w-full flex-1">
                  <div
                    className="w-[42%] bg-status-delivered/70"
                    style={{ height: `${incomeHeight}%`, minHeight: month.income > 0 ? 4 : 0 }}
                  />
                  <div
                    className="w-[42%] bg-status-editing/70"
                    style={{ height: `${expenseHeight}%`, minHeight: month.expenses > 0 ? 4 : 0 }}
                  />
                </div>
                <span className="text-[9px] uppercase tracking-label text-text-muted">
                  {MONTH_LABELS[month.month - 1]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-4 text-[11px] text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 bg-status-delivered/70" />
            Income
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 bg-status-editing/70" />
            Expenses
          </span>
        </div>
      </section>

      <section className="border border-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted mb-4">
          Expenses by category
        </h2>
        {categoryRows.length === 0 ? (
          <p className="text-[13px] text-text-muted">No expenses in this period.</p>
        ) : (
          <ul className="space-y-3">
            {categoryRows.map((row) => (
              <li key={row.category}>
                <div className="flex items-center justify-between gap-3 text-[12px] mb-1">
                  <span className="text-text-secondary">
                    {EXPENSE_CATEGORY_LABELS[row.category as ExpenseCategory]}
                  </span>
                  <span className="tabular-nums text-text-primary">
                    {showAmounts ? (
                      formatMoney(row.amount)
                    ) : (
                      <MaskedMoney amount={row.amount} visible={false} />
                    )}
                  </span>
                </div>
                <div className="h-1.5 bg-border overflow-hidden">
                  <div
                    className="h-full bg-status-editing/80"
                    style={{ width: `${(row.amount / maxCategory) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
