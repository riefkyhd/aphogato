"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { SHOOT_TYPE_COLORS } from "@/lib/calendar/calendarHelpers";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(parseISO(e.shoot_date), day));
}

export function CalendarMonthGrid({
  events,
  currentMonth,
  onEventClick,
  onDayClick,
}: {
  events: CalendarEvent[];
  currentMonth: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="hidden sm:grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] uppercase tracking-label text-text-muted"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr min-h-[280px] sm:min-h-[400px] lg:min-h-[480px]">
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const inMonth = isSameMonth(day, currentMonth);
          const visible = dayEvents.slice(0, MAX_VISIBLE);
          const overflow = dayEvents.length - MAX_VISIBLE;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                "flex flex-col items-stretch text-left min-h-[56px] sm:min-h-[80px] lg:min-h-[100px] p-0.5 sm:p-1 border border-border bg-bg-secondary transition-colors hover:bg-bg-elevated",
                !inMonth && "opacity-40",
                isToday(day) &&
                  "bg-bg-elevated border-text-primary ring-1 ring-inset ring-text-primary/40"
              )}
            >
              <div className="flex items-center gap-1 mb-1 px-0.5 min-h-[18px]">
                <span
                  className={cn(
                    "inline-flex items-center justify-center text-[11px] leading-none",
                    isToday(day)
                      ? "h-[22px] min-w-[22px] rounded-full bg-text-primary text-bg-primary font-medium"
                      : "text-text-muted"
                  )}
                  aria-current={isToday(day) ? "date" : undefined}
                >
                  {format(day, "d")}
                </span>
                {isToday(day) && (
                  <span className="hidden sm:inline text-[9px] uppercase tracking-label text-text-primary">
                    Today
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden">
                {visible.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className="truncate rounded-sm px-1 py-0.5 text-[10px] text-white text-left hover:opacity-90"
                    style={{
                      background:
                        SHOOT_TYPE_COLORS[ev.shoot_type] ??
                        SHOOT_TYPE_COLORS.other,
                    }}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
                {overflow > 0 && (
                  <span className="text-[9px] text-text-muted px-0.5">
                    +{overflow} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
