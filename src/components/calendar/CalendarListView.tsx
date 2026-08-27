"use client";

import { format, isToday, parseISO } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import { EventStatusDot } from "@/components/calendar/EventStatusDot";
import { ShootTypeBadge } from "@/components/calendar/ShootTypeBadge";
import { Button } from "@/components/ui/Button";
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

function ListColumnHeader() {
  return (
    <div className="grid grid-cols-[4rem_1fr_auto] gap-3 px-4 py-2 border-b border-border bg-bg-primary text-[10px] uppercase tracking-label text-text-muted">
      <span>Date</span>
      <span>Event</span>
      <span className="w-4" aria-hidden />
    </div>
  );
}

export function CalendarListView({
  events,
  onEventClick,
  onCreateEvent,
}: {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
}) {
  const groups = groupByMonth(events);

  if (events.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <CalendarPlus
          className="h-8 w-8 mx-auto text-text-muted mb-3"
          aria-hidden
        />
        <p className="text-[14px] text-text-primary">No events yet</p>
        <p className="mt-2 text-[13px] text-text-secondary max-w-sm mx-auto">
          Add your first shoot so it shows up here and on Home.
        </p>
        {onCreateEvent ? (
          <Button
            type="button"
            className="mt-5"
            onClick={onCreateEvent}
          >
            New event
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <ListColumnHeader />
      {[...groups.entries()].map(([monthLabel, monthEvents]) => (
        <section key={monthLabel}>
          <h3 className="uppercase tracking-label text-text-secondary border-b border-border py-3 px-4 text-[11px]">
            {monthLabel}
          </h3>
          {monthEvents.map((ev) => {
            const eventDate = parseISO(ev.shoot_date);
            const today = isToday(eventDate);
            const timeLabel = formatEventTimeRange(
              ev.shoot_time,
              ev.shoot_end_time
            );
            const metaLine = [
              ev.client_name?.trim(),
              ev.location?.trim(),
              timeLabel || null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onEventClick(ev)}
                className={cn(
                  "grid grid-cols-[4rem_1fr_auto] gap-3 w-full items-center min-h-[56px] border-b border-border px-4 py-3 hover:bg-bg-elevated cursor-pointer text-left transition-colors",
                  today && "bg-bg-elevated/60 border-l-2 border-l-text-primary"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] sm:text-[12px] tabular-nums leading-tight",
                    today ? "text-text-primary font-medium" : "text-text-muted"
                  )}
                >
                  {format(eventDate, "MMM d")}
                </span>

                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShootTypeBadge shootType={ev.shoot_type} className="shrink-0" />
                    <span className="min-w-0 text-[14px] text-text-primary truncate">
                      {ev.title}
                    </span>
                  </div>
                  {metaLine ? (
                    <p className="text-[12px] text-text-secondary truncate">
                      {metaLine}
                    </p>
                  ) : null}
                </div>

                <EventStatusDot
                  status={ev.status}
                  showLabel={false}
                  className="shrink-0"
                />
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}
