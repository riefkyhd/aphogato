import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/lib/finance/constants";
import { isGeneralExpense } from "@/lib/finance/linkLabels";
import { filterEntriesByMonth } from "@/lib/finance/summary";
import type {
  EventFinanceRollup,
  ExpenseEntry,
  FinanceBreakdown,
  IncomeEntry,
} from "@/lib/types";

export type { EventFinanceRollup, FinanceBreakdown };

type EventRef = {
  id: string;
  title: string;
  shoot_date: string;
};

function toNumber(amount: string | number): number {
  return typeof amount === "number" ? amount : Number(amount);
}

function filterForPeriod<T extends { entry_date: string }>(
  entries: T[],
  year: number,
  month: number | null
): T[] {
  if (!month) return entries;
  return filterEntriesByMonth(entries, year, month);
}

export function buildFinanceBreakdown(
  year: number,
  month: number | null,
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
  events: EventRef[]
): FinanceBreakdown {
  const periodIncome = filterForPeriod(income, year, month);
  const periodExpenses = filterForPeriod(expenses, year, month);

  const byCategory: Partial<Record<ExpenseCategory, number>> = {};
  for (const category of EXPENSE_CATEGORIES) {
    byCategory[category] = 0;
  }

  let linkedExpenses = 0;
  let generalExpenses = 0;

  for (const row of periodExpenses) {
    const amount = toNumber(row.amount);
    const category = row.category as ExpenseCategory;
    if (EXPENSE_CATEGORIES.includes(category)) {
      byCategory[category] = (byCategory[category] ?? 0) + amount;
    } else {
      byCategory.other = (byCategory.other ?? 0) + amount;
    }

    if (isGeneralExpense(row)) {
      generalExpenses += amount;
    } else {
      linkedExpenses += amount;
    }
  }

  const eventById = new Map(events.map((event) => [event.id, event]));
  const incomeByEvent = new Map<string, number>();
  for (const row of periodIncome) {
    if (!row.event_id) continue;
    incomeByEvent.set(
      row.event_id,
      (incomeByEvent.get(row.event_id) ?? 0) + toNumber(row.amount)
    );
  }

  const expensesByEvent = new Map<string, { total: number; count: number }>();
  for (const row of periodExpenses) {
    if (!row.event_id) continue;
    const current = expensesByEvent.get(row.event_id) ?? { total: 0, count: 0 };
    expensesByEvent.set(row.event_id, {
      total: current.total + toNumber(row.amount),
      count: current.count + 1,
    });
  }

  const eventIds = new Set<string>([
    ...incomeByEvent.keys(),
    ...expensesByEvent.keys(),
  ]);

  const eventRollups: EventFinanceRollup[] = Array.from(eventIds)
    .map((eventId) => {
      const event = eventById.get(eventId);
      const eventIncome = incomeByEvent.get(eventId) ?? 0;
      const expenseRollup = expensesByEvent.get(eventId) ?? {
        total: 0,
        count: 0,
      };
      const net = eventIncome - expenseRollup.total;
      const marginPercent =
        eventIncome > 0 ? (net / eventIncome) * 100 : null;

      return {
        eventId,
        title: event?.title ?? "Calendar event",
        date: event?.shoot_date ?? "",
        income: eventIncome,
        expenses: expenseRollup.total,
        net,
        marginPercent,
        expenseCount: expenseRollup.count,
      };
    })
    .sort((a, b) => b.net - a.net);

  return {
    byCategory,
    linkedExpenses,
    generalExpenses,
    eventRollups,
  };
}

export function topExpenseCategory(
  breakdown: FinanceBreakdown
): { category: ExpenseCategory; amount: number } | null {
  let best: { category: ExpenseCategory; amount: number } | null = null;

  for (const category of EXPENSE_CATEGORIES) {
    const amount = breakdown.byCategory[category] ?? 0;
    if (amount <= 0) continue;
    if (!best || amount > best.amount) {
      best = { category, amount };
    }
  }

  return best;
}

export function bestMarginShoot(
  rollups: EventFinanceRollup[]
): EventFinanceRollup | null {
  const withIncome = rollups.filter((row) => row.income > 0);
  if (withIncome.length === 0) return null;
  return withIncome.reduce((best, row) => (row.net > best.net ? row : best));
}

export function worstMarginShoot(
  rollups: EventFinanceRollup[]
): EventFinanceRollup | null {
  const withIncome = rollups.filter((row) => row.income > 0);
  if (withIncome.length === 0) return null;
  return withIncome.reduce((worst, row) => (row.net < worst.net ? row : worst));
}
