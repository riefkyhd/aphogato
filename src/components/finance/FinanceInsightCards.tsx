"use client";

import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import {
  bestMarginShoot,
  topExpenseCategory,
  worstMarginShoot,
} from "@/lib/finance/breakdown";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import type { FinanceBreakdown } from "@/lib/types";

export function FinanceInsightCards({
  breakdown,
  showAmounts,
}: {
  breakdown: FinanceBreakdown;
  showAmounts: boolean;
}) {
  const topCategory = topExpenseCategory(breakdown);
  const bestShoot = bestMarginShoot(breakdown.eventRollups);
  const worstShoot = worstMarginShoot(breakdown.eventRollups);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] mb-6">
      <div className="border border-border bg-bg-secondary p-4">
        <p className="text-[11px] uppercase tracking-label text-text-muted">
          Shoot vs overhead
        </p>
        <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
          Shoot-linked{" "}
          <span className="text-text-primary tabular-nums">
            <MaskedMoney amount={breakdown.linkedExpenses} visible={showAmounts} />
          </span>
          <br />
          General{" "}
          <span className="text-text-primary tabular-nums">
            <MaskedMoney amount={breakdown.generalExpenses} visible={showAmounts} />
          </span>
        </p>
      </div>

      <div className="border border-border bg-bg-secondary p-4">
        <p className="text-[11px] uppercase tracking-label text-text-muted">
          Top expense category
        </p>
        <p className="mt-2 text-[15px] text-text-primary">
          {topCategory ? (
            <>
              {EXPENSE_CATEGORY_LABELS[topCategory.category as ExpenseCategory]}
              <span className="block mt-1 text-[13px] text-text-secondary tabular-nums">
                <MaskedMoney amount={topCategory.amount} visible={showAmounts} />
              </span>
            </>
          ) : (
            <span className="text-[13px] text-text-muted">No expenses</span>
          )}
        </p>
      </div>

      <div className="border border-border bg-bg-secondary p-4">
        <p className="text-[11px] uppercase tracking-label text-text-muted">
          Margin range
        </p>
        {bestShoot ? (
          <div className="mt-2 space-y-2 text-[12px] text-text-secondary leading-relaxed">
            <p>
              Best:{" "}
              <span className="text-text-primary">{bestShoot.title}</span>
              <span className="block tabular-nums text-status-delivered">
                <MaskedMoney amount={bestShoot.net} visible={showAmounts} />
              </span>
            </p>
            {worstShoot && worstShoot.eventId !== bestShoot.eventId ? (
              <p>
                Lowest:{" "}
                <span className="text-text-primary">{worstShoot.title}</span>
                <span className="block tabular-nums text-status-editing">
                  <MaskedMoney amount={worstShoot.net} visible={showAmounts} />
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-text-muted">
            No shoots with recorded income.
          </p>
        )}
      </div>
    </div>
  );
}
