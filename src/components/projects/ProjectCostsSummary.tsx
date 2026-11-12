"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowUpRight, Wallet } from "lucide-react";
import Link from "next/link";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { LinkedExpensesBlock } from "@/components/finance/LinkedExpensesBlock";
import { ExpenseQuickAdd } from "@/components/finance/ExpenseQuickAdd";
import { sumExpenseAmounts } from "@/lib/finance/projectExpenses";
import type { CalendarEvent, ExpenseEntry, Project } from "@/lib/types";
import type { SavedQuotation } from "@/lib/quotations/db";

export function ProjectCostsSummary({
  project,
  event,
  quotation,
  initialExpenses,
  onExpensesChanged,
}: {
  project: Project;
  event: CalendarEvent | null;
  quotation: SavedQuotation | null;
  initialExpenses: ExpenseEntry[];
  onExpensesChanged?: () => void;
}) {
  const { moneyVisible, isLocked } = usePrivacyLockContext();
  const showAmounts = moneyVisible && !isLocked;

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(initialExpenses);
  const [savingQuick, setSavingQuick] = useState(false);

  const totalExpense = useMemo(() => sumExpenseAmounts(expenses), [expenses]);
  const quotedRevenue = quotation?.subtotal ?? 0;
  const netProfit = quotedRevenue - totalExpense;
  const marginPercent = quotedRevenue > 0
    ? Math.round((netProfit / quotedRevenue) * 100)
    : 0;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const shootDate = event?.shoot_date || todayStr;

  function handleExpenseAdded(newEntry: ExpenseEntry) {
    setExpenses((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);
    if (onExpensesChanged) onExpensesChanged();
  }

  return (
    <div className="space-y-6">
      {/* Profitability KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border bg-bg-secondary p-4 sm:p-5">
          <span className="text-[11px] uppercase tracking-label text-text-muted">
            Quoted Package
          </span>
          <p className="mt-1 text-[18px] text-text-primary font-medium tabular-nums">
            <MaskedMoney amount={quotedRevenue} visible={showAmounts} />
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            {quotation ? quotation.quote_number : "No quotation linked"}
          </p>
        </div>

        <div className="border border-border bg-bg-secondary p-4 sm:p-5">
          <span className="text-[11px] uppercase tracking-label text-text-muted">
            Total Shoot Costs
          </span>
          <p className="mt-1 text-[18px] text-status-editing font-medium tabular-nums">
            <MaskedMoney amount={totalExpense} visible={showAmounts} />
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            {expenses.length} logged expense{expenses.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="border border-border bg-bg-secondary p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-label text-text-muted">
              Net Shoot Profit
            </span>
            {quotedRevenue > 0 ? (
              <span className="text-[10px] uppercase tracking-label px-2 py-0.5 rounded-sm bg-status-delivered/10 text-status-delivered border border-status-delivered/20">
                {marginPercent}% Margin
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[18px] text-status-delivered font-medium tabular-nums">
            <MaskedMoney amount={netProfit} visible={showAmounts} />
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Quoted revenue minus shoot costs
          </p>
        </div>
      </div>

      {/* Inline 1-Line Quick Expense Logger */}
      <div className="border border-border bg-bg-secondary p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-text-muted" aria-hidden />
            <h3 className="text-[11px] uppercase tracking-label text-text-muted">
              Quick Log Expense
            </h3>
          </div>
          <Link
            href="/dashboard/finance"
            className="text-[11px] uppercase tracking-label text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
          >
            All Finance
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <p className="text-[12px] text-text-secondary">
          Rapidly log costs for this shoot (transport, crew, meal, gear). Category and amount are pre-linked to this project.
        </p>

        <div className="border border-border/80 bg-bg-primary/40 p-3">
          <ExpenseQuickAdd
            entryDate={shootDate}
            projectId={project.id}
            eventId={event?.id ?? ""}
            saving={savingQuick}
            onSavingChange={setSavingQuick}
            onSaved={handleExpenseAdded}
          />
        </div>
      </div>

      {/* Detailed Linked Expenses List */}
      <div className="border border-border bg-bg-secondary p-4 sm:p-5">
        <LinkedExpensesBlock
          expenses={expenses}
          events={
            event
              ? [
                  {
                    id: event.id,
                    title: event.title,
                    shoot_date: event.shoot_date,
                    client_name: event.client_name,
                    project_id: event.project_id,
                  },
                ]
              : []
          }
          projects={[{ id: project.id, name: project.name }]}
          defaultProjectId={project.id}
          defaultEventId={event?.id ?? ""}
          defaultDate={shootDate}
          onChanged={() => {
            if (onExpensesChanged) onExpensesChanged();
          }}
          compact
        />
      </div>
    </div>
  );
}
