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
import type { ExpenseEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const fieldCompactClass = "input-dark field-compact w-full text-[13px]";

const POPULAR_CHIPS: { id: ExpenseCategory; label: string }[] = [
  { id: "fuel", label: "Fuel" },
  { id: "food", label: "Food/Meal" },
  { id: "assistant", label: "Assistant/Crew" },
  { id: "transportation", label: "Transport" },
  { id: "equipment", label: "Equipment" },
  { id: "camera_rent", label: "Camera Rent" },
  { id: "parking", label: "Parking" },
  { id: "other", label: "Other" },
];

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
  onSaved: (entry: ExpenseEntry) => void;
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
    amountRef.current?.focus();
    onSaved(result.entry);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 1-Tap Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {POPULAR_CHIPS.map((chip) => {
          const active = category === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategory(chip.id)}
              className={cn(
                "min-h-[36px] sm:min-h-[28px] px-2.5 py-1 text-[11px] uppercase tracking-label font-medium rounded-sm border transition-colors shrink-0",
                active
                  ? "bg-bg-primary text-text-primary border-text-muted shadow-sm"
                  : "bg-transparent text-text-muted border-border hover:text-text-secondary hover:border-border/80"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_minmax(6.5rem,8rem)_auto] gap-2 items-end">
        <div className="min-w-0">
          <Label htmlFor="quick-expense-amount" className="sr-only">
            Amount
          </Label>
          <Input
            ref={amountRef}
            id="quick-expense-amount"
            inputMode="numeric"
            placeholder="Amount (e.g. 50000)"
            value={amount}
            disabled={saving}
            onChange={(e) => setAmount(e.target.value)}
            className="field-compact tabular-nums min-h-[44px] sm:min-h-9"
          />
        </div>

        <div className="min-w-0 hidden sm:block">
          <Label htmlFor="quick-expense-category" className="sr-only">
            Category
          </Label>
          <select
            id="quick-expense-category"
            className={fieldCompactClass}
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

        <Button
          type="submit"
          size="sm"
          loading={saving}
          disabled={saving}
          className="shrink-0 min-h-[44px] sm:min-h-9 px-4"
        >
          Add Expense
        </Button>
      </div>

      {onOpenFullForm && (
        <div className="pt-1">
          <button
            type="button"
            className="text-[10px] uppercase tracking-label text-text-muted hover:text-text-primary transition-colors"
            onClick={onOpenFullForm}
          >
            More fields (date, notes, custom link)…
          </button>
        </div>
      )}
    </form>
  );
}
