"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormActions } from "@/components/ui/FormActions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import { parseMoneyInput } from "@/lib/finance/formatMoney";
import type {
  FinanceEventOption,
  FinanceProjectOption,
  SaveExpenseAction,
} from "@/lib/finance/financeOptions";
import type { ExpenseEntry } from "@/lib/types";

export type { FinanceEventOption, FinanceProjectOption } from "@/lib/finance/financeOptions";

const selectClass = "input-dark w-full";

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[max(0px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[min(90dvh,calc(100dvh-1rem))] overflow-y-auto bg-bg-elevated border border-border border-b-0 sm:border-b p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] rounded-t-sm sm:rounded-sm">
        {children}
      </div>
    </div>
  );
}

function resetNewEntryFields(
  setters: {
    setAmount: (v: string) => void;
    setCategory: (v: ExpenseCategory) => void;
    setDescription: (v: string) => void;
    setNotes: (v: string) => void;
  },
  keep: {
    entryDate: string;
    eventId: string;
    projectId: string;
  },
  setEntryDate: (v: string) => void,
  setEventId: (v: string) => void,
  setProjectId: (v: string) => void
) {
  setters.setAmount("");
  setters.setCategory("fuel");
  setters.setDescription("");
  setters.setNotes("");
  setEntryDate(keep.entryDate);
  setEventId(keep.eventId);
  setProjectId(keep.projectId);
}

export function ExpenseFormModal({
  open,
  entry,
  events,
  projects,
  defaultDate,
  defaultEventId = "",
  defaultProjectId = "",
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  entry: ExpenseEntry | null;
  events: FinanceEventOption[];
  projects: FinanceProjectOption[];
  defaultDate: string;
  defaultEventId?: string;
  defaultProjectId?: string;
  saving: boolean;
  onClose: () => void;
  onSave: (
    payload: Record<string, unknown>,
    action: SaveExpenseAction
  ) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [category, setCategory] = useState<ExpenseCategory>("fuel");
  const [description, setDescription] = useState("");
  const [eventId, setEventId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const isEdit = Boolean(entry);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setAmount(String(entry.amount));
      setEntryDate(entry.entry_date);
      setCategory(entry.category as ExpenseCategory);
      setDescription(entry.description ?? "");
      setEventId(entry.event_id ?? "");
      setProjectId(entry.project_id ?? "");
      setNotes(entry.notes ?? "");
    } else {
      setAmount("");
      setEntryDate(defaultDate);
      setCategory("fuel");
      setDescription("");
      setEventId(defaultEventId);
      setProjectId(defaultProjectId);
      setNotes("");
    }
  }, [open, entry, defaultDate, defaultEventId, defaultProjectId]);

  if (!open) return null;

  function buildPayload(): Record<string, unknown> | null {
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      return null;
    }
    return {
      amount: parsed,
      entry_date: entryDate,
      category,
      description: description || null,
      event_id: eventId || null,
      project_id: projectId || null,
      notes: notes || null,
    };
  }

  async function handleSubmit(action: SaveExpenseAction) {
    const payload = buildPayload();
    if (!payload) {
      return;
    }
    const ok = await onSave(payload, action);
    if (!ok) return;

    if (!isEdit && action === "another") {
      resetNewEntryFields(
        { setAmount, setCategory, setDescription, setNotes },
        {
          entryDate,
          eventId,
          projectId,
        },
        setEntryDate,
        setEventId,
        setProjectId
      );
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-light tracking-[0.05em] uppercase mb-4">
        {isEdit ? "Edit expense" : "Add expense"}
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit("close");
        }}
      >
        <Field label="Amount (IDR)" value={amount} onChange={setAmount} />
        <Field label="Date" value={entryDate} onChange={setEntryDate} type="date" />
        <div>
          <Label>Category</Label>
          <select
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <Field label="Description" value={description} onChange={setDescription} />
        <div>
          <Label>Gallery project (optional)</Label>
          <select
            className={selectClass}
            value={projectId}
            onChange={(e) => {
              const id = e.target.value;
              setProjectId(id);
              if (id && eventId) {
                const ev = events.find((x) => x.id === eventId);
                if (ev?.project_id && ev.project_id !== id) {
                  setEventId("");
                }
              }
            }}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Calendar event (optional)</Label>
          <select
            className={selectClass}
            value={eventId}
            onChange={(e) => {
              const id = e.target.value;
              setEventId(id);
              const ev = events.find((x) => x.id === id);
              if (ev) {
                setEntryDate(ev.shoot_date);
                if (ev.project_id) {
                  setProjectId(ev.project_id);
                }
              }
            }}
          >
            <option value="">None</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.shoot_date})
              </option>
            ))}
          </select>
        </div>
        <Field label="Notes" value={notes} onChange={setNotes} />
        <FormActions className="sm:flex-row sm:[&_button]:flex-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!isEdit && (
            <Button
              type="button"
              variant="secondary"
              loading={saving}
              disabled={saving}
              onClick={() => void handleSubmit("another")}
            >
              Save &amp; add another
            </Button>
          )}
          <Button type="submit" loading={saving} disabled={saving}>
            {isEdit ? "Save" : "Save & close"}
          </Button>
        </FormActions>
      </form>
    </ModalOverlay>
  );
}
