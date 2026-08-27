"use client";

import { format, parseISO } from "date-fns";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import type { EventFinanceRollup } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ShootProfitabilityTable({
  rollups,
  showAmounts,
  selectedEventId,
  onSelectEvent,
}: {
  rollups: EventFinanceRollup[];
  showAmounts: boolean;
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
}) {
  if (rollups.length === 0) {
    return (
      <section className="mb-6 border border-border bg-bg-secondary p-4 sm:p-5">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted">
          Shoot profitability
        </h2>
        <p className="mt-3 text-[13px] text-text-muted">
          No event-linked income or expenses in this period.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 border border-border bg-bg-secondary">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[11px] uppercase tracking-label text-text-muted">
          Shoot profitability
        </h2>
        <p className="mt-1 text-[12px] text-text-secondary">
          Click a row to drill into that event.
        </p>
      </div>
      <ul className="md:hidden divide-y divide-border">
        {rollups.map((row) => (
          <li
            key={row.eventId}
            className={cn(
              "px-4 py-3 cursor-pointer",
              selectedEventId === row.eventId && "bg-bg-primary/50"
            )}
            onClick={() => onSelectEvent(row.eventId)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-text-primary truncate">
                  {row.title}
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {row.date
                    ? format(parseISO(row.date), "d MMM yyyy")
                    : "No date"}
                </p>
              </div>
              <p
                className={cn(
                  "text-[13px] tabular-nums shrink-0",
                  row.net >= 0 ? "text-status-delivered" : "text-status-editing"
                )}
              >
                <MaskedMoney amount={row.net} visible={showAmounts} />
              </p>
            </div>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <dt className="uppercase tracking-label text-text-muted">
                  Income
                </dt>
                <dd className="mt-0.5 tabular-nums text-status-delivered">
                  {row.income > 0 ? (
                    <MaskedMoney amount={row.income} visible={showAmounts} />
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-label text-text-muted">
                  Expenses
                </dt>
                <dd className="mt-0.5 tabular-nums text-status-editing">
                  <MaskedMoney amount={row.expenses} visible={showAmounts} />
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-label text-text-muted">
                  Margin
                </dt>
                <dd className="mt-0.5 tabular-nums text-text-secondary">
                  {row.marginPercent !== null && showAmounts
                    ? `${Math.round(row.marginPercent)}%`
                    : "—"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-label text-text-muted border-b border-border">
              <th className="text-left font-normal px-4 py-2">Event</th>
              <th className="text-left font-normal px-4 py-2">Date</th>
              <th className="text-right font-normal px-4 py-2">Income</th>
              <th className="text-right font-normal px-4 py-2">Expenses</th>
              <th className="text-right font-normal px-4 py-2">Net</th>
              <th className="text-right font-normal px-4 py-2">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rollups.map((row) => (
              <tr
                key={row.eventId}
                className={cn(
                  "border-b border-border/60 cursor-pointer hover:bg-bg-primary/40",
                  selectedEventId === row.eventId && "bg-bg-primary/50"
                )}
                onClick={() => onSelectEvent(row.eventId)}
              >
                <td className="px-4 py-3 text-text-primary">{row.title}</td>
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                  {row.date
                    ? format(parseISO(row.date), "d MMM yyyy")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-status-delivered">
                  {row.income > 0 ? (
                    <MaskedMoney amount={row.income} visible={showAmounts} />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-status-editing">
                  <MaskedMoney amount={row.expenses} visible={showAmounts} />
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right tabular-nums",
                    row.net >= 0 ? "text-status-delivered" : "text-status-editing"
                  )}
                >
                  <MaskedMoney amount={row.net} visible={showAmounts} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                  {row.marginPercent !== null && showAmounts
                    ? `${Math.round(row.marginPercent)}%`
                    : row.income > 0
                      ? "—"
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
