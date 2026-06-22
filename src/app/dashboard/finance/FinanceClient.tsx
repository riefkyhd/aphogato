"use client";

import { format, parseISO } from "date-fns";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardMain } from "@/components/layout/DashboardShell";
import { EventFinanceDetail } from "@/components/finance/EventFinanceDetail";
import {
  EventFinanceFilter,
  getEventsWithFinanceInPeriod,
} from "@/components/finance/EventFinanceFilter";
import { FinanceCharts } from "@/components/finance/FinanceCharts";
import { FinanceInsightCards } from "@/components/finance/FinanceInsightCards";
import { ShootProfitabilityTable } from "@/components/finance/ShootProfitabilityTable";
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
import { ModalShell } from "@/components/ui/ModalShell";
import { ExpenseFormModal } from "@/components/finance/ExpenseFormModal";
import { ExpenseQuickAdd } from "@/components/finance/ExpenseQuickAdd";
import type {
  FinanceEventOption,
  FinanceProjectOption,
} from "@/lib/finance/financeOptions";
import { saveExpenseApi } from "@/lib/finance/saveExpenseApi";
import {
  removeExpenseById,
  removeIncomeById,
  syncFinanceSummary,
  upsertExpenseInYear,
  upsertIncomeInYear,
} from "@/lib/finance/syncClientFinance";
import { buildFinanceBreakdown } from "@/lib/finance/breakdown";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/finance/constants";
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
import { normalizeIncome } from "@/lib/finance/normalize";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
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
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | "all">(
    "all"
  );
  const [selectedEventId, setSelectedEventId] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    isLocked,
    moneyVisible,
    toggleMoneyVisible,
    guardSensitiveAction,
    requestUnlock,
  } = usePrivacyLockContext();

  useBodyScrollLock(isLocked);

  const reloadSeq = useRef(0);
  const financeRef = useRef({ income, expenses });
  financeRef.current = { income, expenses };

  const applyFinanceEntries = useCallback(
    (nextIncome: IncomeEntry[], nextExpenses: ExpenseEntry[]) => {
      financeRef.current = { income: nextIncome, expenses: nextExpenses };
      setIncome(nextIncome);
      setExpenses(nextExpenses);
      setSummary(syncFinanceSummary(year, month, nextIncome, nextExpenses, events));
    },
    [year, month, events]
  );

  const applyExpenseEntry = useCallback(
    (entry: ExpenseEntry) => {
      const { income: currentIncome, expenses: currentExpenses } =
        financeRef.current;
      applyFinanceEntries(
        currentIncome,
        upsertExpenseInYear(currentExpenses, entry, year)
      );
    },
    [applyFinanceEntries, year]
  );

  const removeExpenseEntry = useCallback(
    (id: string) => {
      const { income: currentIncome, expenses: currentExpenses } =
        financeRef.current;
      applyFinanceEntries(
        currentIncome,
        removeExpenseById(currentExpenses, id)
      );
    },
    [applyFinanceEntries]
  );

  const applyIncomeEntry = useCallback(
    (entry: IncomeEntry) => {
      const { income: currentIncome, expenses: currentExpenses } =
        financeRef.current;
      applyFinanceEntries(
        upsertIncomeInYear(currentIncome, entry, year),
        currentExpenses
      );
    },
    [applyFinanceEntries, year]
  );

  const removeIncomeEntry = useCallback(
    (id: string) => {
      const { income: currentIncome, expenses: currentExpenses } =
        financeRef.current;
      applyFinanceEntries(
        removeIncomeById(currentIncome, id),
        currentExpenses
      );
    },
    [applyFinanceEntries]
  );

  useEffect(() => {
    const fromUrl = searchParams.get("event")?.trim() ?? "";
    if (fromUrl) setSelectedEventId(fromUrl);
  }, [searchParams]);

  const setEventFilter = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId);
      const params = new URLSearchParams(searchParams.toString());
      if (eventId) params.set("event", eventId);
      else params.delete("event");
      const query = params.toString();
      router.replace(query ? `/dashboard/finance?${query}` : "/dashboard/finance", {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const reload = useCallback(async (y: number, m: number | null) => {
    const seq = ++reloadSeq.current;
    setLoading(true);
    try {
      const monthQuery = m ? `&month=${m}` : "";
      const [sumRes, incRes, expRes] = await Promise.all([
        fetch(`/api/finance/summary?year=${y}${monthQuery}`),
        fetch(`/api/finance/income?year=${y}`),
        fetch(`/api/finance/expenses?year=${y}`),
      ]);
      if (seq !== reloadSeq.current) return;

      const sumJson = await sumRes.json();
      const incJson = await incRes.json();
      const expJson = await expRes.json();
      if (!sumRes.ok) throw new Error(sumJson.error ?? "Failed to load summary");
      if (!incRes.ok) {
        throw new Error(
          (incJson as { error?: string }).error ?? "Failed to load income"
        );
      }
      if (!expRes.ok) {
        throw new Error(
          (expJson as { error?: string }).error ?? "Failed to load expenses"
        );
      }
      setSummary(sumJson as FinanceSummary);
      setIncome(Array.isArray(incJson) ? incJson : []);
      setExpenses(Array.isArray(expJson) ? expJson : []);
    } catch (err) {
      if (seq === reloadSeq.current) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      if (seq === reloadSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  const onYearChange = (y: number) => {
    if (y === year || loading) return;
    setYear(y);
    void reload(y, month);
  };

  const breakdown = useMemo(
    () => buildFinanceBreakdown(year, month, income, expenses, events),
    [year, month, income, expenses, events]
  );

  const eventsInPeriod = useMemo(
    () => {
      const periodIncome = month
        ? filterEntriesByMonth(income, year, month)
        : income;
      const periodExpenses = month
        ? filterEntriesByMonth(expenses, year, month)
        : expenses;
      return getEventsWithFinanceInPeriod(periodIncome, periodExpenses, events);
    },
    [income, expenses, events, year, month]
  );

  const filteredIncome = useMemo(() => {
    let rows = month ? filterEntriesByMonth(income, year, month) : income;
    if (selectedEventId) {
      rows = rows.filter((row) => row.event_id === selectedEventId);
    }
    return rows;
  }, [income, year, month, selectedEventId]);

  const filteredExpenses = useMemo(() => {
    let rows = month ? filterEntriesByMonth(expenses, year, month) : expenses;
    if (expenseScope === "linked") {
      rows = rows.filter((row) => !isGeneralExpense(row));
    } else if (expenseScope === "general") {
      rows = rows.filter((row) => isGeneralExpense(row));
    }
    if (expenseCategory !== "all") {
      rows = rows.filter((row) => row.category === expenseCategory);
    }
    if (selectedEventId) {
      rows = rows.filter((row) => row.event_id === selectedEventId);
    }
    return rows;
  }, [expenses, year, month, expenseScope, expenseCategory, selectedEventId]);

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
            <Tooltip
              label={
                isLocked
                  ? "Unlock to view amounts"
                  : moneyVisible
                    ? "Hide amounts"
                    : "Show amounts"
              }
            >
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center border border-border text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                aria-label={
                  isLocked
                    ? "Unlock to view amounts"
                    : moneyVisible
                      ? "Hide amounts"
                      : "Show amounts"
                }
                onClick={() => {
                  if (isLocked) {
                    requestUnlock({
                      title: "Show amounts",
                      description:
                        "Enter your privacy PIN to view finance amounts.",
                    });
                    return;
                  }
                  toggleMoneyVisible();
                }}
              >
                {moneyVisible && !isLocked ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </Tooltip>
            <Label htmlFor="finance-year" className="sr-only">
              Year
            </Label>
            <select
              id="finance-year"
              className="input-dark select-compact w-[100px]"
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <EventFinanceFilter
              events={eventsInPeriod}
              value={selectedEventId}
              onChange={setEventFilter}
            />
          </div>
          <PageToolbarActions>
            <Tooltip label="Export finance data as CSV">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={toolbarButtonClass}
                aria-label="Export finance data as CSV"
                onClick={handleExportCsv}
              >
                Export CSV
              </Button>
            </Tooltip>
            <Tooltip label="Add income entry">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={toolbarButtonClass}
                aria-label="Add income entry"
                onClick={() => {
                  setEditingIncome(null);
                  setIncomeModal(true);
                }}
              >
                + Income
              </Button>
            </Tooltip>
            <Tooltip label="Add expense entry">
              <Button
                type="button"
                size="sm"
                className={toolbarButtonClass}
                aria-label="Add expense entry"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseModal(true);
                }}
              >
                + Expense
              </Button>
            </Tooltip>
          </PageToolbarActions>
        </div>
      </div>

      {loading ? (
        <div
          className="relative min-h-[320px]"
          aria-busy="true"
          aria-label={`Loading ${year} finance data`}
        >
          <FinanceDataLoadingOverlay year={year} />
        </div>
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

      <FinanceInsightCards breakdown={breakdown} showAmounts={showAmounts} />
      <FinanceCharts
        summary={summary}
        breakdown={breakdown}
        showAmounts={showAmounts}
      />
      <ShootProfitabilityTable
        rollups={breakdown.eventRollups}
        showAmounts={showAmounts}
        selectedEventId={selectedEventId}
        onSelectEvent={setEventFilter}
      />

      {selectedEventId ? (
        <EventFinanceDetail
          eventId={selectedEventId}
          events={events}
          income={month ? filterEntriesByMonth(income, year, month) : income}
          expenses={
            month ? filterEntriesByMonth(expenses, year, month) : expenses
          }
          showAmounts={showAmounts}
          onEditExpense={(row) => {
            setEditingExpense(row);
            setExpenseModal(true);
          }}
        />
      ) : null}

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
                  ? `${MONTH_LABELS[m.month - 1]} ${year}: income ${formatMoney(m.income)}, expenses ${formatMoney(m.expenses)}, net ${formatMoney(m.net)}`
                  : undefined
              }
              className={cn(
                "border border-border p-2 sm:p-3 text-left transition-colors min-h-[88px] min-w-0",
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
              {showAmounts ? (
                <p className="mt-1 text-[9px] text-text-muted leading-snug">
                  <span className="text-status-delivered/80">
                    {formatMoney(m.income)}
                  </span>
                  {" · "}
                  <span className="text-status-editing/80">
                    {formatMoney(m.expenses)}
                  </span>
                </p>
              ) : null}
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
                removeIncomeEntry(row.id);
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
            <div className="px-4 py-3 border-b border-border">
              <Label htmlFor="expense-category-filter" className="sr-only">
                Expense category
              </Label>
              <select
                id="expense-category-filter"
                value={expenseCategory}
                onChange={(event) =>
                  setExpenseCategory(event.target.value as ExpenseCategory | "all")
                }
                className="input-dark select-compact w-full sm:w-auto"
              >
                <option value="all">All categories</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {EXPENSE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-4 py-3 border-b border-border bg-bg-primary/40">
              <p className="text-[11px] uppercase tracking-label text-text-muted mb-2">
                Quick add overhead
              </p>
              <ExpenseQuickAdd
                entryDate={generalExpenseDefaultDate}
                saving={saving}
                onSavingChange={setSaving}
                onSaved={(entry) => applyExpenseEntry(entry)}
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
                  removeExpenseEntry(row.id);
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
            applyIncomeEntry(normalizeIncome(json));
            setIncomeModal(false);
            setEditingIncome(null);
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
          applyExpenseEntry(result.entry);

          if (editingExpense || action === "close") {
            setExpenseModal(false);
            setEditingExpense(null);
          }

          return true;
        }}
      />
      </div>

      {isLocked ? (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center p-6 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="finance-lock-title"
        >
          <div
            className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm"
            aria-hidden
          />
          <div className="relative max-w-sm w-full border border-border bg-bg-elevated p-6 text-center shadow-lg">
            <Lock className="h-8 w-8 mx-auto text-text-muted mb-4" aria-hidden />
            <h2
              id="finance-lock-title"
              className="text-lg font-light tracking-[0.05em] uppercase"
            >
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

function FinanceDataLoadingOverlay({ year }: { year: number }) {
  return (
  <>
      <div className="flex items-center justify-center gap-3 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" aria-hidden />
        <p className="text-[13px] text-text-secondary">Loading {year}…</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px] mb-6">
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
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="border border-border bg-bg-secondary min-h-[240px] animate-pulse"
          />
        ))}
      </div>
  </>
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

  const titleId = "income-form-title";

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        className="text-lg font-light tracking-[0.05em] uppercase mb-4"
      >
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
    </ModalShell>
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

