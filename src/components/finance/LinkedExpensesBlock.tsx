"use client";

import { format, parseISO } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExpenseFormModal } from "@/components/finance/ExpenseFormModal";
import { ExpenseQuickAdd } from "@/components/finance/ExpenseQuickAdd";
import { Button } from "@/components/ui/Button";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import {
  type FinanceEventOption,
  type FinanceProjectOption,
  hasLinkedExpenseContext,
  type SaveExpenseAction,
} from "@/lib/finance/financeOptions";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { saveExpenseApi } from "@/lib/finance/saveExpenseApi";
import { sumExpenseAmounts } from "@/lib/finance/projectExpenses";
import type { ExpenseEntry } from "@/lib/types";

export function LinkedExpensesBlock({
  expenses,
  events,
  projects,
  defaultEventId = "",
  defaultProjectId = "",
  defaultDate,
  onChanged,
  compact = false,
}: {
  expenses: ExpenseEntry[];
  events: FinanceEventOption[];
  projects: FinanceProjectOption[];
  defaultEventId?: string;
  defaultProjectId?: string;
  defaultDate: string;
  onChanged: () => void;
  compact?: boolean;
}) {
  const { moneyVisible, isLocked } = usePrivacyLockContext();
  const showAmounts = moneyVisible && !isLocked;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const linkedContext = hasLinkedExpenseContext(
    defaultEventId,
    defaultProjectId
  );
  const total = useMemo(() => sumExpenseAmounts(expenses), [expenses]);

  const saveFromModal = useCallback(
    async (payload: Record<string, unknown>, action: SaveExpenseAction) => {
      setSaving(true);
      const result = await saveExpenseApi(payload, editing?.id);
      setSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        return false;
      }

      toast.success(editing ? "Expense updated" : "Expense added");
      onChanged();

      if (editing || action === "close") {
        setModalOpen(false);
        setEditing(null);
      }

      return true;
    },
    [editing, onChanged]
  );

  const openFullForm = (entry: ExpenseEntry | null) => {
    setEditing(entry);
    setModalOpen(true);
  };

  return (
    <div className={compact ? "" : "border-t border-border pt-4 mt-2"}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[11px] uppercase tracking-label text-text-muted">
            Expenses
          </p>
          <p className="text-[15px] text-status-editing tabular-nums mt-0.5">
            <MaskedMoney amount={total} visible={showAmounts} />
            {expenses.length > 0 && (
              <span className="text-[11px] text-text-muted ml-2 normal-case tracking-normal">
                ({expenses.length} item{expenses.length === 1 ? "" : "s"})
              </span>
            )}
          </p>
        </div>
        {!linkedContext && (
          <Button
            type="button"
            variant="secondary"
            className="!text-[10px] !px-2 !py-1.5 shrink-0"
            onClick={() => openFullForm(null)}
          >
            Add
          </Button>
        )}
      </div>

      {linkedContext && (
        <div className="mb-3 border border-border/80 bg-bg-primary/40 px-3 py-3">
          <ExpenseQuickAdd
            entryDate={defaultDate}
            eventId={defaultEventId}
            projectId={defaultProjectId}
            saving={saving}
            onSavingChange={setSaving}
            onSaved={onChanged}
            onOpenFullForm={() => openFullForm(null)}
          />
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="text-[12px] text-text-secondary">
          {linkedContext
            ? "Add costs above — category and amount are enough."
            : "No costs linked yet."}
        </p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {expenses.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-2 text-[12px] border border-border/60 px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="text-text-primary truncate">
                  {EXPENSE_CATEGORY_LABELS[row.category as ExpenseCategory]}
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
                  onClick={() => openFullForm(row)}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ExpenseFormModal
        open={modalOpen}
        entry={editing}
        events={events}
        projects={projects}
        defaultDate={defaultDate}
        defaultEventId={editing ? "" : defaultEventId}
        defaultProjectId={editing ? "" : defaultProjectId}
        saving={saving}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={saveFromModal}
      />
    </div>
  );
}
