"use client";

import { format, isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
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
          {monthEvents.map((ev) => {
            const eventDate = parseISO(ev.shoot_date);
            const today = isToday(eventDate);
            return (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEventClick(ev)}
              className={cn(
                "flex w-full items-center gap-2 sm:gap-3 min-h-[56px] sm:h-16 border-b border-border px-3 sm:px-4 py-2 sm:py-0 hover:bg-bg-elevated cursor-pointer text-left transition-colors",
                today && "bg-bg-elevated/60 border-l-2 border-l-text-primary"
              )}
            >
              <span
                className={cn(
                  "w-14 shrink-0 text-[12px]",
                  today ? "text-text-primary font-medium" : "text-text-muted"
                )}
              >
                {today ? "Today" : format(eventDate, "MMM d")}
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
          );
          })}
        </section>
      ))}
    </div>
  );
}
