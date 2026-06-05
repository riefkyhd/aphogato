import { format, parseISO } from "date-fns";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import type { CalendarEvent } from "@/lib/types";

function sortedEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.shoot_date.localeCompare(b.shoot_date));
}

export async function exportCalendarListPdf(
  events: CalendarEvent[],
  opts?: { title?: string; filename?: string }
) {
  if (events.length === 0) {
    throw new Error("No events to export");
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  const title = opts?.title ?? "Shoot schedule";
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Generated ${format(new Date(), "MMM d, yyyy · HH:mm")} · ${events.length} event${events.length === 1 ? "" : "s"}`,
    margin,
    y
  );
  doc.setTextColor(0);
  y += 8;

  const colWidths = {
    date: 24,
    title: 44,
    client: 30,
    location: 34,
    time: 28,
    status: 26,
  };

  const drawHeader = () => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80);
    let x = margin;
    doc.text("Date", x, y);
    x += colWidths.date;
    doc.text("Title", x, y);
    x += colWidths.title;
    doc.text("Client", x, y);
    x += colWidths.client;
    doc.text("Location", x, y);
    x += colWidths.location;
    doc.text("Time", x, y);
    x += colWidths.time;
    doc.text("Status", x, y);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    y += 4;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  drawHeader();

  for (const ev of sortedEvents(events)) {
    const dateLabel = format(parseISO(ev.shoot_date), "MMM d, yyyy");
    const timeLabel = formatEventTimeRange(ev.shoot_time, ev.shoot_end_time) || "—";
    const client = ev.client_name?.trim() || "—";
    const location = ev.location?.trim() || "—";

    const titleLines = doc.splitTextToSize(ev.title, colWidths.title - 1);
    const clientLines = doc.splitTextToSize(client, colWidths.client - 1);
    const locationLines = doc.splitTextToSize(location, colWidths.location - 1);
    const rowHeight =
      Math.max(
        titleLines.length,
        clientLines.length,
        locationLines.length,
        1
      ) *
        4 +
      2;

    if (y + rowHeight > 285) {
      doc.addPage();
      y = margin;
      drawHeader();
    }

    const rowTop = y;
    let x = margin;
    doc.setFontSize(8);
    doc.text(dateLabel, x, rowTop);
    x += colWidths.date;
    doc.text(titleLines, x, rowTop);
    x += colWidths.title;
    doc.text(clientLines, x, rowTop);
    x += colWidths.client;
    doc.text(locationLines, x, rowTop);
    x += colWidths.location;
    doc.text(timeLabel, x, rowTop);
    x += colWidths.time;
    doc.text(ev.status, x, rowTop);

    y += rowHeight;
  }

  const filename =
    opts?.filename ??
    `shoot-schedule-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
}
