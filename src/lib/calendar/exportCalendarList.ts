import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export function formatCalendarListText(events: CalendarEvent[]): string {
  const sorted = [...events].sort((a, b) =>
    a.shoot_date.localeCompare(b.shoot_date)
  );

  if (sorted.length === 0) {
    return "No calendar events.\n";
  }

  const lines = sorted.map((ev) => {
    const date = format(parseISO(ev.shoot_date), "yyyy-MM-dd (EEE)");
    const client = ev.client_name?.trim() || "—";
    const location = ev.location?.trim() || "—";
    const time =
      ev.shoot_time && ev.shoot_end_time
        ? `${ev.shoot_time}–${ev.shoot_end_time}`
        : ev.shoot_time || "—";
    return `${date}\t${ev.title}\t${client}\t${location}\t${time}\t${ev.status}`;
  });

  return ["Date\tTitle\tClient\tLocation\tTime\tStatus", ...lines].join("\n") + "\n";
}

export function downloadCalendarList(events: CalendarEvent[], filename?: string) {
  const blob = new Blob([formatCalendarListText(events)], {
    type: "text/plain;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename ?? `calendar-events-${format(new Date(), "yyyy-MM-dd")}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}
