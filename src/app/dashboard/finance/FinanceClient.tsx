"use client";

import { format, parseISO } from "date-fns";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { MaskedMoney } from "@/components/privacy/MaskedMoney";
import { usePrivacyLockContext } from "@/components/privacy/PrivacyLockProvider";
import { Button } from "@/components/ui/Button";
import { FormActions } from "@/components/ui/FormActions";
import {
  PageToolbarActions,
  toolbarButtonClass,
} from "@/components/ui/PageToolbarActions";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tooltip } from "@/components/ui/Tooltip";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ExpenseFormModal } from "@/components/finance/ExpenseFormModal";
import { ExpenseQuickAdd } from "@/components/finance/ExpenseQuickAdd";
import type {
  FinanceEventOption,
  FinanceProjectOption,
} from "@/lib/finance/financeOptions";
import { saveExpenseApi } from "@/lib/finance/saveExpenseApi";
import {
  formatExpensePrimary,
  formatExpenseSecondary,
  isGeneralExpense,
} from "@/lib/finance/linkLabels";
import { formatMoney } from "@/lib/finance/formatMoney";
import { filterEntriesByMonth } from "@/lib/finance/summary";
import {
  downloadFinanceReport,
  formatFinanceReportCsv,
  formatReportPeriodLabel,
} from "@/lib/finance/exportReport";
import type {
  ExpenseEntry,
  FinanceSummary,
  IncomeEntry,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function FinanceClient({
  initialYear,
  initialSummary,
  initialIncome,
  initialExpenses,
  events,
  projects,
}: {
  initialYear: number;
  initialSummary: FinanceSummary;
  initialIncome: IncomeEntry[];
  initialExpenses: ExpenseEntry[];
  events: FinanceEventOption[];
  projects: FinanceProjectOption[];
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [summary, setSummary] = useState(initialSummary);
  const [income, setIncome] = useState(initialIncome);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState(false);

  const [incomeModal, setIncomeModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [expenseScope, setExpenseScope] = useState<"all" | "linked" | "general">(
    "all"
  );

  const {
    isLocked,
    moneyVisible,
    toggleMoneyVisible,
    guardSensitiveAction,
    requestUnlock,
  } = usePrivacyLockContext();

  const reload = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const [sumRes, incRes, expRes] = await Promise.all([
        fetch(`/api/finance/summary?year=${y}`),
        fetch(`/api/finance/income?year=${y}`),
        fetch(`/api/finance/expenses?year=${y}`),
      ]);
      const sumJson = await sumRes.json();
      const incJson = await incRes.json();
      const expJson = await expRes.json();
      if (!sumRes.ok) throw new Error(sumJson.error ?? "Failed to load summary");
      setSummary(sumJson as FinanceSummary);
      setIncome(Array.isArray(incJson) ? incJson : []);
      setExpenses(Array.isArray(expJson) ? expJson : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const onYearChange = (y: number) => {
    if (y === year) return;
    setLoading(true);
    setYear(y);
    void reload(y);
  };

  const filteredIncome = useMemo(() => {
    if (!month) return income;
    return filterEntriesByMonth(income, year, month);
  }, [income, year, month]);

  const filteredExpenses = useMemo(() => {
    let rows = month ? filterEntriesByMonth(expenses, year, month) : expenses;
    if (expenseScope === "linked") {
      rows = rows.filter((row) => !isGeneralExpense(row));
    } else if (expenseScope === "general") {
      rows = rows.filter((row) => isGeneralExpense(row));
    }
    return rows;
  }, [expenses, year, month, expenseScope]);

  const generalExpenseDefaultDate = month
    ? `${year}-${String(month).padStart(2, "0")}-01`
    : format(new Date(), "yyyy-MM-dd");

  const periodIncome = month
    ? (summary.months[month - 1]?.income ?? 0)
    : summary.totalIncome;
  const periodExpenses = month
    ? (summary.months[month - 1]?.expenses ?? 0)
    : summary.totalExpenses;
  const periodNet = periodIncome - periodExpenses;

  const eventById = useMemo(
    () => new Map(events.map((e) => [e.id, e])),
    [events]
  );
  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const showAmounts = moneyVisible && !isLocked;

  function handleExportCsv() {
    guardSensitiveAction(
      () => {
        const csv = formatFinanceReportCsv({
          year,
          month,
          summary,
          income,
          expenses,
          events,
          projects,
        });
        downloadFinanceReport(csv, year, month);
        toast.success(
          `Exported ${formatReportPeriodLabel(year, month)} report`
        );
      },
      {
        title: "Export finance report",
        description: "Enter your privacy PIN to export finance data as CSV.",
      }
    );
  }

  return (
    <DashboardMain className="relative">
      <div
        className={cn(
          "transition-[filter] duration-200",
          isLocked && "blur-md pointer-events-none select-none"
        )}
      >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-light tracking-[0.05em] uppercase">
            Finance
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Client income, shoot costs, and general overhead (GDrive, Lightroom,
            subscriptions, etc.)
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            <Tooltip label={moneyVisible ? "Hide amounts" : "Show amounts"}>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center border border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label={moneyVisible ? "Hide amounts" : "Show amounts"}
                onClick={toggleMoneyVisible}
              >
                {moneyVisible ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </Tooltip>
            <Label htmlFor="finance-year" className="sr-only">
              Year
            </Label>
            <div className="relative inline-flex items-center">
              <select
                id="finance-year"
                className="input-dark select-compact w-[100px] pr-8"
                value={year}
                disabled={loading}
                onChange={(e) => onYearChange(Number(e.target.value))}
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {loading && (
                <Loader2
                  className="pointer-events-none absolute right-2 h-3.5 w-3.5 animate-spin text-text-muted"
                  aria-hidden
                />
              )}
            </div>
          </div>
          <PageToolbarActions>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={toolbarButtonClass}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={toolbarButtonClass}
              onClick={() => {
                setEditingIncome(null);
                setIncomeModal(true);
              }}
            >
              + Income
            </Button>
            <Button
              type="button"
              size="sm"
              className={toolbarButtonClass}
              onClick={() => {
                setEditingExpense(null);
                setExpenseModal(true);
              }}
            >
              + Expense
            </Button>
          </PageToolbarActions>
        </div>
      </div>

      {loading ? (
        <FinanceYearLoading year={year} />
      ) : (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] mb-6">
        <SummaryCard label="Income" amount={periodIncome} visible={showAmounts} positive />
        <SummaryCard label="Expenses" amount={periodExpenses} visible={showAmounts} />
        <SummaryCard
          label="Net"
          amount={periodNet}
          visible={showAmounts}
          positive={periodNet >= 0}
          highlight
        />
      </div>

      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
          {year} overview
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-[2px]">
          {summary.months.map((m) => (
            <button
              key={m.month}
              type="button"
              onClick={() => setMonth(m.month)}
              title={
                showAmounts
                  ? `${MONTH_LABELS[m.month - 1]} ${year}: ${formatMoney(m.net)}`
                  : undefined
              }
              className={cn(
                "border border-border p-2 sm:p-3 text-left transition-colors min-h-[72px] min-w-0",
                month === m.month
                  ? "bg-bg-elevated border-text-primary"
                  : "bg-bg-secondary hover:bg-bg-elevated"
              )}
            >
              <span className="text-[10px] uppercase tracking-label text-text-muted">
                {MONTH_LABELS[m.month - 1]}
              </span>
              <p
                className={cn(
                  "mt-1 text-[10px] sm:text-[11px] font-medium tabular-nums leading-snug break-words",
                  m.net >= 0 ? "text-status-delivered" : "text-status-editing"
                )}
              >
                <MaskedMoney amount={m.net} visible={showAmounts} />
              </p>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 text-[11px] uppercase tracking-label text-text-muted hover:text-text-primary"
          onClick={() => setMonth(null)}
        >
          View full year
        </button>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EntryList
            title="Income"
            empty="No income recorded for this period."
            showAmounts={showAmounts}
            entries={filteredIncome.map((row) => ({
              id: row.id,
              date: row.entry_date,
              amount: row.amount,
              primary: row.client_name ?? row.description ?? "Client payment",
              secondary: row.event_id
                ? eventById.get(row.event_id)?.title ?? "Calendar event"
                : null,
              onEdit: () => {
                setEditingIncome(row);
                setIncomeModal(true);
              },
              onDelete: async () => {
                const res = await fetch(`/api/finance/income/${row.id}`, {
                  method: "DELETE",
                });
                if (!res.ok) {
                  toast.error("Failed to delete");
                  return;
                }
                toast.success("Income removed");
                void reload(year);
              },
            }))}
          />
          <section className="border border-border bg-bg-secondary">
            <div className="flex flex-col gap-3 px-4 py-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[11px] uppercase tracking-label">Expenses</h2>
                <p className="mt-1 text-[11px] text-text-muted">
                  General expenses do not need a project or calendar event.
                </p>
              </div>
              <SegmentedControl
                value={expenseScope}
                size="compact"
                aria-label="Expense scope"
                options={[
                  { value: "all", label: "All" },
                  { value: "linked", label: "Shoot-linked" },
                  { value: "general", label: "General" },
                ]}
                onChange={setExpenseScope}
              />
            </div>
            <div className="px-4 py-3 border-b border-border bg-bg-primary/40">
              <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
                Quick add overhead
              </p>
              <ExpenseQuickAdd
                entryDate={generalExpenseDefaultDate}
                saving={saving}
                onSavingChange={setSaving}
                onSaved={() => void reload(year)}
                onOpenFullForm={() => {
                  setEditingExpense(null);
                  setExpenseModal(true);
                }}
              />
            </div>
            <EntryListBody
              showAmounts={showAmounts}
              empty={
                expenseScope === "general"
                  ? "No general overhead for this period. Use quick add above for tools and subscriptions."
                  : "No expenses recorded for this period."
              }
              entries={filteredExpenses.map((row) => ({
                id: row.id,
                date: row.entry_date,
                amount: row.amount,
                primary: formatExpensePrimary(row),
                secondary: formatExpenseSecondary(row, eventById, projectById),
                onEdit: () => {
                  setEditingExpense(row);
                  setExpenseModal(true);
                },
                onDelete: async () => {
                  const res = await fetch(`/api/finance/expenses/${row.id}`, {
                    method: "DELETE",
                  });
                  if (!res.ok) {
                    toast.error("Failed to delete");
                    return;
                  }
                  toast.success("Expense removed");
                  void reload(year);
                },
              }))}
            />
          </section>
        </div>
        </>
      )}

      <IncomeFormModal
        open={incomeModal}
        entry={editingIncome}
        events={events}
        defaultDate={
          month
            ? `${year}-${String(month).padStart(2, "0")}-01`
            : format(new Date(), "yyyy-MM-dd")
        }
        saving={saving}
        onClose={() => {
          setIncomeModal(false);
          setEditingIncome(null);
        }}
        onSave={async (payload) => {
          setSaving(true);
          try {
            const url = editingIncome
              ? `/api/finance/income/${editingIncome.id}`
              : "/api/finance/income";
            const res = await fetch(url, {
              method: editingIncome ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) {
              toast.error(json.error ?? "Failed to save");
              return;
            }
            toast.success(editingIncome ? "Income updated" : "Income added");
            setIncomeModal(false);
            setEditingIncome(null);
            void reload(year);
          } finally {
            setSaving(false);
          }
        }}
      />

      <ExpenseFormModal
        open={expenseModal}
        entry={editingExpense}
        events={events}
        projects={projects}
        defaultDate={
          month
            ? `${year}-${String(month).padStart(2, "0")}-01`
            : format(new Date(), "yyyy-MM-dd")
        }
        saving={saving}
        onClose={() => {
          setExpenseModal(false);
          setEditingExpense(null);
        }}
        onSave={async (payload, action) => {
          setSaving(true);
          const result = await saveExpenseApi(
            payload,
            editingExpense?.id
          );
          setSaving(false);

          if (!result.ok) {
            toast.error(result.error);
            return false;
          }

          toast.success(
            editingExpense ? "Expense updated" : "Expense added"
          );
          void reload(year);

          if (editingExpense || action === "close") {
            setExpenseModal(false);
            setEditingExpense(null);
          }

          return true;
        }}
      />
      </div>

      {isLocked ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="max-w-sm w-full border border-border bg-bg-elevated p-6 text-center shadow-lg">
            <Lock className="h-8 w-8 mx-auto text-text-muted mb-4" aria-hidden />
            <h2 className="text-lg font-light tracking-[0.05em] uppercase">
              Finance locked
            </h2>
            <p className="mt-2 text-[13px] text-text-secondary">
              Enter your privacy PIN to view amounts and manage finance.
            </p>
            <Button
              type="button"
              className="mt-5 w-full"
              onClick={() =>
                requestUnlock({
                  title: "Unlock finance",
                  description:
                    "Enter your privacy PIN to view finance and perform sensitive actions.",
                })
              }
            >
              Enter PIN
            </Button>
          </div>
        </div>
      ) : null}
    </DashboardMain>
  );
}

function FinanceYearLoading({ year }: { year: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={`Loading ${year} finance data`}>
      <div className="flex items-center justify-center gap-3 py-4">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" aria-hidden />
        <p className="text-[13px] text-text-secondary">Loading {year}…</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border border-border bg-bg-secondary p-4 sm:p-5 animate-pulse"
          >
            <div className="h-3 w-16 bg-bg-elevated rounded-sm" />
            <div className="mt-3 h-7 w-24 bg-bg-elevated rounded-sm" />
          </div>
        ))}
      </div>
      <div>
        <div className="h-3 w-28 bg-bg-elevated rounded-sm mb-3 animate-pulse" />
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-[2px]">
          {MONTH_LABELS.map((label) => (
            <div
              key={label}
              className="border border-border bg-bg-secondary p-2 sm:p-3 min-h-[72px] animate-pulse"
            >
              <div className="h-2.5 w-8 bg-bg-elevated rounded-sm" />
              <div className="mt-2 h-4 w-12 bg-bg-elevated rounded-sm" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border border-border bg-bg-secondary min-h-[240px] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  visible,
  positive,
  highlight,
}: {
  label: string;
  amount: number;
  visible: boolean;
  positive?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-border p-4 sm:p-5",
        highlight ? "bg-bg-elevated" : "bg-bg-secondary"
      )}
    >
      <p className="text-[11px] uppercase tracking-label text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-lg sm:text-xl font-light",
          positive === true && "text-status-delivered",
          positive === false && "text-status-editing"
        )}
      >
        <MaskedMoney amount={amount} visible={visible} />
      </p>
    </div>
  );
}

function EntryList({
  title,
  empty,
  showAmounts,
  entries,
}: {
  title: string;
  empty: string;
  showAmounts: boolean;
  entries: Array<{
    id: string;
    date: string;
    amount: number;
    primary: string;
    secondary: string | null;
    onEdit: () => void;
    onDelete: () => void;
  }>;
}) {
  return (
    <section className="border border-border bg-bg-secondary">
      <h2 className="px-4 py-3 text-[11px] uppercase tracking-label border-b border-border">
        {title}
      </h2>
      <EntryListBody empty={empty} showAmounts={showAmounts} entries={entries} />
    </section>
  );
}

function EntryListBody({
  empty,
  showAmounts,
  entries,
}: {
  empty: string;
  showAmounts: boolean;
  entries: Array<{
    id: string;
    date: string;
    amount: number;
    primary: string;
    secondary: string | null;
    onEdit: () => void;
    onDelete: () => void;
  }>;
}) {
  if (entries.length === 0) {
    return <p className="px-4 py-8 text-[13px] text-text-muted">{empty}</p>;
  }

  return (
    <ul>
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border last:border-0"
        >
          <div className="min-w-0">
            <p className="text-[13px] text-text-primary truncate">{e.primary}</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {format(parseISO(e.date), "EEE, MMM d, yyyy")}
              {e.secondary ? ` · ${e.secondary}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[13px] text-text-primary">
              <MaskedMoney amount={e.amount} visible={showAmounts} />
            </p>
            <div className="flex gap-2 mt-1 justify-end">
              <button
                type="button"
                className="text-[10px] uppercase tracking-label text-text-muted hover:text-text-primary"
                onClick={e.onEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-[10px] uppercase tracking-label text-status-editing hover:opacity-80"
                onClick={e.onDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const selectClass = "input-dark w-full";

function IncomeFormModal({
  open,
  entry,
  events,
  defaultDate,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  entry: IncomeEntry | null;
  events: FinanceEventOption[];
  defaultDate: string;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(defaultDate);
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [eventId, setEventId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setAmount(String(entry.amount));
      setEntryDate(entry.entry_date);
      setClientName(entry.client_name ?? "");
      setDescription(entry.description ?? "");
      setEventId(entry.event_id ?? "");
      setNotes(entry.notes ?? "");
    } else {
      setAmount("");
      setEntryDate(defaultDate);
      setClientName("");
      setDescription("");
      setEventId("");
      setNotes("");
    }
  }, [open, entry, defaultDate]);

  if (!open) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-light tracking-[0.05em] uppercase mb-4">
        {entry ? "Edit income" : "Add income"}
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            amount: Number(amount.replace(/[^\d.]/g, "")),
            entry_date: entryDate,
            client_name: clientName || null,
            description: description || null,
            event_id: eventId || null,
            notes: notes || null,
          });
        }}
      >
        <Field label="Amount (IDR)" value={amount} onChange={setAmount} />
        <Field label="Date" value={entryDate} onChange={setEntryDate} type="date" />
        <Field label="Client" value={clientName} onChange={setClientName} />
        <Field label="Description" value={description} onChange={setDescription} />
        <div>
          <Label>Calendar event</Label>
          <select
            className={selectClass}
            value={eventId}
            onChange={(e) => {
              const id = e.target.value;
              setEventId(id);
              const ev = events.find((x) => x.id === id);
              if (ev) {
                setEntryDate(ev.shoot_date);
                if (ev.client_name) setClientName(ev.client_name);
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
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </FormActions>
      </form>
    </ModalOverlay>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-bg-primary/80"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-bg-elevated border border-border p-6 sm:rounded-sm">
        {children}
      </div>
    </div>
  );
}
