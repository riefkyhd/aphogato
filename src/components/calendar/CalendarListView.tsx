"use client";

import { format, parseISO } from "date-fns";
import { EventStatusDot } from "@/components/calendar/EventStatusDot";
import { ShootTypeBadge } from "@/components/calendar/ShootTypeBadge";
import type { CalendarEvent } from "@/lib/types";

function groupByMonth(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = format(parseISO(ev.shoot_date), "MMMM yyyy");
    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }
  return map;
}

export function CalendarListView({
  events,
  onEventClick,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}) {
  const groups = groupByMonth(events);

  if (events.length === 0) {
    return (
      <p className="px-4 py-12 text-[13px] text-text-muted text-center">
        No events yet. Create one with NEW EVENT.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {[...groups.entries()].map(([monthLabel, monthEvents]) => (
        <section key={monthLabel}>
          <h3 className="uppercase tracking-label text-text-secondary border-b border-border py-3 px-4 text-[11px]">
            {monthLabel}
          </h3>
          {monthEvents.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEventClick(ev)}
              className="flex w-full items-center gap-3 h-16 border-b border-border px-4 hover:bg-bg-elevated cursor-pointer text-left transition-colors"
            >
              <span className="w-14 shrink-0 text-[12px] text-text-muted">
                {format(parseISO(ev.shoot_date), "MMM d")}
              </span>
              <ShootTypeBadge shootType={ev.shoot_type} className="shrink-0" />
              <span className="flex-1 min-w-0 text-[14px] text-text-primary truncate">
                {ev.title}
              </span>
              <span className="hidden sm:block text-[12px] text-text-secondary truncate max-w-[120px]">
                {ev.client_name ?? "—"}
              </span>
              <EventStatusDot status={ev.status} showLabel={false} />
              <span className="hidden md:block text-[12px] text-text-muted truncate max-w-[140px]">
                {ev.location ?? ""}
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
