"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import { parseMoneyInput } from "@/lib/finance/formatMoney";
import {
  buildLinkedExpensePayload,
  saveExpenseApi,
} from "@/lib/finance/saveExpenseApi";

const selectClass = "input-dark w-full h-9";

export function ExpenseQuickAdd({
  entryDate,
  eventId = "",
  projectId = "",
  saving,
  onSavingChange,
  onSaved,
  onOpenFullForm,
}: {
  entryDate: string;
  eventId?: string;
  projectId?: string;
  saving: boolean;
  onSavingChange: (v: boolean) => void;
  onSaved: () => void;
  onOpenFullForm?: () => void;
}) {
  const [category, setCategory] = useState<ExpenseCategory>("fuel");
  const [amount, setAmount] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    onSavingChange(true);
    const result = await saveExpenseApi(
      buildLinkedExpensePayload({
        amount: parsed,
        category,
        entryDate,
        eventId,
        projectId,
      })
    );
    onSavingChange(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Expense added");
    setAmount("");
    setCategory("fuel");
    amountRef.current?.focus();
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_minmax(6.5rem,8rem)_auto] gap-2 items-end">
        <div className="min-w-0">
          <Label htmlFor="quick-expense-category" className="sr-only">
            Category
          </Label>
          <select
            id="quick-expense-category"
            className={selectClass}
            value={category}
            disabled={saving}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <Label htmlFor="quick-expense-amount" className="sr-only">
            Amount
          </Label>
          <Input
            ref={amountRef}
            id="quick-expense-amount"
            inputMode="numeric"
            placeholder="Amount"
            value={amount}
            disabled={saving}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 tabular-nums"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          loading={saving}
          disabled={saving}
          className="shrink-0"
        >
          Add
        </Button>
      </div>
      {onOpenFullForm && (
        <button
          type="button"
          className="text-[10px] uppercase tracking-label text-text-muted hover:text-text-primary"
          onClick={onOpenFullForm}
        >
          More fields (date, notes, link)…
        </button>
      )}
    </form>
  );
}
