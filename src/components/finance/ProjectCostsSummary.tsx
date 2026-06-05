"use client";

import Link from "next/link";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";

export function ProjectCostsSummary({
  total,
  count,
}: {
  total: number;
  count: number;
}) {
  const { moneyVisible, isLocked, pinEnabled } = usePrivacyLockContext();
  const showAmounts = moneyVisible && !isLocked;

  return (
    <div className="border border-border bg-bg-secondary px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11px] uppercase tracking-label text-text-muted">
            Project costs
          </p>
          <p className="mt-0.5 text-[15px] text-status-editing tabular-nums">
            <MaskedMoney amount={total} visible={showAmounts} />
            {count > 0 && (
              <span className="text-[11px] text-text-muted ml-2 normal-case tracking-normal">
                ({count} item{count === 1 ? "" : "s"})
              </span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/finance"
          className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary transition-colors shrink-0"
        >
          Open in Finance →
        </Link>
      </div>
      {count === 0 && (
        <p className="mt-2 text-[12px] text-text-secondary">
          No costs linked yet. Log shoot expenses from{" "}
          <Link
            href="/dashboard/calendar"
            className="text-text-primary hover:underline"
          >
            Calendar
          </Link>{" "}
          or add them in{" "}
          <Link
            href="/dashboard/finance"
            className="text-text-primary hover:underline"
          >
            Finance
          </Link>
          .
        </p>
      )}
      {pinEnabled && isLocked && count > 0 && (
        <p className="mt-2 text-[11px] text-text-muted">
          Amounts hidden — unlock Finance to view.
        </p>
      )}
    </div>
  );
}
