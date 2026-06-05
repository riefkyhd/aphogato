import { format, parseISO } from "date-fns";
import {
  formatExpensePrimary,
  formatExpenseSecondary,
  isGeneralExpense,
} from "@/lib/finance/linkLabels";
import { formatMoney } from "@/lib/finance/formatMoney";
import type {
  ExpenseEntry,
  FinanceSummary,
  IncomeEntry,
} from "@/lib/types";

type EventRef = { id: string; title: string };
type ProjectRef = { id: string; name: string };

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map((c) => csvEscape(String(c))).join(",");
}

function filterByPeriod<T extends { entry_date: string }>(
  entries: T[],
  year: number,
  month: number | null
): T[] {
  if (!month) {
    const prefix = `${year}-`;
    return entries.filter((e) => e.entry_date.startsWith(prefix));
  }
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return entries.filter((e) => e.entry_date.startsWith(prefix));
}

export function formatFinanceReportCsv({
  year,
  month,
  summary,
  income,
  expenses,
  events,
  projects,
}: {
  year: number;
  month: number | null;
  summary: FinanceSummary;
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  events: EventRef[];
  projects: ProjectRef[];
}): string {
  const eventById = new Map(events.map((e) => [e.id, e]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const periodIncome = month
    ? (summary.months[month - 1]?.income ?? 0)
    : summary.totalIncome;
  const periodExpenses = month
    ? (summary.months[month - 1]?.expenses ?? 0)
    : summary.totalExpenses;
  const periodNet = periodIncome - periodExpenses;

  const periodLabel = month
    ? format(new Date(year, month - 1, 1), "MMMM yyyy")
    : String(year);

  const filteredIncome = filterByPeriod(income, year, month);
  const filteredExpenses = filterByPeriod(expenses, year, month);

  const lines: string[] = [
    csvRow(["Aphogato Finance Report", periodLabel]),
    "",
    csvRow(["Summary"]),
    csvRow(["Income", formatMoney(periodIncome)]),
    csvRow(["Expenses", formatMoney(periodExpenses)]),
    csvRow(["Net", formatMoney(periodNet)]),
    "",
    csvRow(["Income entries"]),
    csvRow(["Date", "Amount", "Currency", "Client", "Description", "Linked event"]),
  ];

  if (filteredIncome.length === 0) {
    lines.push(csvRow(["—", "—", "—", "—", "—", "—"]));
  } else {
    for (const row of filteredIncome) {
      const linked = row.event_id
        ? (eventById.get(row.event_id)?.title ?? "Calendar event")
        : "";
      lines.push(
        csvRow([
          row.entry_date,
          row.amount,
          row.currency,
          row.client_name ?? "",
          row.description ?? "",
          linked,
        ])
      );
    }
  }

  lines.push("");
  lines.push(csvRow(["Expense entries"]));
  lines.push(
    csvRow([
      "Date",
      "Amount",
      "Currency",
      "Category",
      "Description",
      "Scope",
      "Linked",
    ])
  );

  if (filteredExpenses.length === 0) {
    lines.push(csvRow(["—", "—", "—", "—", "—", "—", "—"]));
  } else {
    for (const row of filteredExpenses) {
      const scope = isGeneralExpense(row) ? "General" : "Linked";
      lines.push(
        csvRow([
          row.entry_date,
          row.amount,
          row.currency,
          row.category,
          formatExpensePrimary(row),
          scope,
          formatExpenseSecondary(row, eventById, projectById),
        ])
      );
    }
  }

  if (!month) {
    lines.push("");
    lines.push(csvRow(["Monthly breakdown"]));
    lines.push(csvRow(["Month", "Income", "Expenses", "Net"]));
    for (const m of summary.months) {
      lines.push(
        csvRow([
          format(new Date(year, m.month - 1, 1), "MMM"),
          formatMoney(m.income),
          formatMoney(m.expenses),
          formatMoney(m.net),
        ])
      );
    }
  }

  lines.push("");
  lines.push(
    csvRow(["Generated", format(new Date(), "yyyy-MM-dd HH:mm")])
  );

  return lines.join("\n") + "\n";
}

export function downloadFinanceReport(
  csv: string,
  year: number,
  month: number | null
) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const suffix = month
    ? `${year}-${String(month).padStart(2, "0")}`
    : String(year);
  a.download = `finance-report-${suffix}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function formatReportPeriodLabel(year: number, month: number | null) {
  if (!month) return String(year);
  return format(parseISO(`${year}-${String(month).padStart(2, "0")}-01`), "MMMM yyyy");
}
