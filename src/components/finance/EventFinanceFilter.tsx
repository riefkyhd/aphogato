"use client";

import { format, parseISO } from "date-fns";
import type { FinanceEventOption } from "@/lib/finance/financeOptions";
import type { ExpenseEntry, IncomeEntry } from "@/lib/types";
import { Label } from "@/components/ui/Label";

export function getEventsWithFinanceInPeriod(
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
  events: FinanceEventOption[]
): FinanceEventOption[] {
  const eventIds = new Set<string>();
  for (const row of income) {
    if (row.event_id) eventIds.add(row.event_id);
  }
  for (const row of expenses) {
    if (row.event_id) eventIds.add(row.event_id);
  }

  return events
    .filter((event) => eventIds.has(event.id))
    .sort((a, b) => b.shoot_date.localeCompare(a.shoot_date));
}

export function EventFinanceFilter({
  events,
  value,
  onChange,
}: {
  events: FinanceEventOption[];
  value: string;
  onChange: (eventId: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1 sm:max-w-xs">
      <Label htmlFor="finance-event-filter" className="sr-only">
        Filter by event
      </Label>
      <select
        id="finance-event-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-dark select-compact w-full"
      >
        <option value="">All events</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
            {event.shoot_date
              ? ` · ${format(parseISO(event.shoot_date), "d MMM yyyy")}`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
