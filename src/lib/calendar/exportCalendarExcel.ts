import { format, parseISO } from "date-fns";
import { formatEventTimeRange } from "@/lib/calendar/calendarHelpers";
import {
  PAYMENT_STATUS_LABELS,
  formatServicesSummary,
  normalizeServices,
  normalizePaymentStatus,
} from "@/lib/calendar/serviceTags";
import type { CalendarEvent, EventStatus } from "@/lib/types";

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "Scheduled",
  shot: "Shot",
  editing: "Editing",
  delivered: "Delivered",
};

export async function exportCalendarExcel(
  events: CalendarEvent[],
  opts?: { title?: string; filename?: string }
): Promise<void> {
  if (events.length === 0) {
    throw new Error("No events to export");
  }

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Muhammad Hadid Photography";
  workbook.lastModifiedBy = "Muhammad Hadid Photography";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("Shoot Schedule", {
    views: [{ showGridLines: true }],
  });

  const sorted = [...events].sort((a, b) =>
    a.shoot_date.localeCompare(b.shoot_date)
  );

  // 1. Studio Header Banner
  sheet.mergeCells("A1:J1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "MUHAMMAD HADID PHOTOGRAPHY";
  titleCell.font = { name: "Helvetica", size: 16, bold: true, color: { argb: "FF111111" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:J2");
  const subCell = sheet.getCell("A2");
  const subTitle = opts?.title ?? "Shoot Schedule";
  subCell.value = `${subTitle.toUpperCase()} • Generated ${format(new Date(), "MMM d, yyyy · HH:mm")} • ${sorted.length} total shoot${sorted.length === 1 ? "" : "s"}`;
  subCell.font = { name: "Helvetica", size: 9, italic: true, color: { argb: "FF666666" } };
  subCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(2).height = 18;

  // 2. KPI Summary Card
  const scheduledCount = sorted.filter((e) => e.status === "scheduled").length;
  const shotCount = sorted.filter((e) => e.status === "shot").length;
  const editingCount = sorted.filter((e) => e.status === "editing").length;
  const deliveredCount = sorted.filter((e) => e.status === "delivered").length;

  const photoOnlyCount = sorted.filter((e) => {
    const s = normalizeServices(e.services);
    return s.includes("photography") && !s.includes("videography");
  }).length;
  const videoOnlyCount = sorted.filter((e) => {
    const s = normalizeServices(e.services);
    return s.includes("videography") && !s.includes("photography");
  }).length;
  const bothServicesCount = sorted.filter((e) => {
    const s = normalizeServices(e.services);
    return s.includes("photography") && s.includes("videography");
  }).length;

  const paidFullCount = sorted.filter((e) => normalizePaymentStatus(e.payment_status) === "paid_in_full").length;
  const dpPaidCount = sorted.filter((e) => normalizePaymentStatus(e.payment_status) === "deposit_paid").length;
  const unpaidCount = sorted.filter((e) => normalizePaymentStatus(e.payment_status) === "unpaid").length;

  sheet.getRow(3).height = 8;

  // KPI Row 4: Card Headers
  const kpiHeaders = [
    { cell: "A4:B4", label: "TOTAL SHOOTS", bg: "FFF4F4F5" },
    { cell: "C4:E4", label: "SHOOT STATUS", bg: "FFF4F4F5" },
    { cell: "F4:G4", label: "SERVICES BREAKDOWN", bg: "FFF4F4F5" },
    { cell: "H4:J4", label: "PAYMENT STATUS", bg: "FFF4F4F5" },
  ];

  for (const kpi of kpiHeaders) {
    sheet.mergeCells(kpi.cell);
    const [startCell] = kpi.cell.split(":");
    const c = sheet.getCell(startCell);
    c.value = kpi.label;
    c.font = { name: "Helvetica", size: 8, bold: true, color: { argb: "FF71717A" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: kpi.bg },
    };
    c.border = {
      top: { style: "thin", color: { argb: "FFE4E4E7" } },
      left: { style: "thin", color: { argb: "FFE4E4E7" } },
      right: { style: "thin", color: { argb: "FFE4E4E7" } },
    };
  }
  sheet.getRow(4).height = 18;

  // KPI Row 5: Metric values
  sheet.mergeCells("A5:B5");
  const totCell = sheet.getCell("A5");
  totCell.value = sorted.length;
  totCell.font = { name: "Helvetica", size: 14, bold: true, color: { argb: "FF18181B" } };
  totCell.alignment = { vertical: "middle", horizontal: "center" };
  totCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  totCell.border = {
    left: { style: "thin", color: { argb: "FFE4E4E7" } },
    bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
  };

  sheet.mergeCells("C5:E5");
  const statCell = sheet.getCell("C5");
  statCell.value = `Scheduled: ${scheduledCount}  |  Shot: ${shotCount}  |  Editing: ${editingCount}  |  Delivered: ${deliveredCount}`;
  statCell.font = { name: "Helvetica", size: 9, color: { argb: "FF27272A" } };
  statCell.alignment = { vertical: "middle", horizontal: "center" };
  statCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  statCell.border = {
    bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
  };

  sheet.mergeCells("F5:G5");
  const servCell = sheet.getCell("F5");
  servCell.value = `Photo: ${photoOnlyCount}  |  Video: ${videoOnlyCount}  |  Both: ${bothServicesCount}`;
  servCell.font = { name: "Helvetica", size: 9, color: { argb: "FF27272A" } };
  servCell.alignment = { vertical: "middle", horizontal: "center" };
  servCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  servCell.border = {
    bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
  };

  sheet.mergeCells("H5:J5");
  const payCell = sheet.getCell("H5");
  payCell.value = `Paid Full: ${paidFullCount}  |  DP Paid: ${dpPaidCount}  |  Unpaid: ${unpaidCount}`;
  payCell.font = { name: "Helvetica", size: 9, color: { argb: "FF27272A" } };
  payCell.alignment = { vertical: "middle", horizontal: "center" };
  payCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  payCell.border = {
    right: { style: "thin", color: { argb: "FFE4E4E7" } },
    bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
  };
  sheet.getRow(5).height = 24;

  sheet.getRow(6).height = 14;

  // 3. Table Column Headers (Row 7)
  const columns = [
    { key: "shoot_date", header: "DATE", width: 14 },
    { key: "day_name", header: "DAY", width: 12 },
    { key: "shoot_time", header: "TIME RANGE", width: 16 },
    { key: "title", header: "SHOOT TITLE", width: 34 },
    { key: "client_name", header: "CLIENT", width: 22 },
    { key: "services", header: "SERVICES", width: 18 },
    { key: "location", header: "LOCATION", width: 26 },
    { key: "status", header: "STATUS", width: 16 },
    { key: "payment_status", header: "PAYMENT STATUS", width: 16 },
    { key: "notes", header: "NOTES", width: 34 },
  ];

  sheet.columns = columns.map((c) => ({
    key: c.key,
    width: c.width,
  }));

  const tableHeaderRowIndex = 7;
  const headerRow = sheet.getRow(tableHeaderRowIndex);
  headerRow.height = 24;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: idx < 3 ? "center" : "left" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A1A1A" },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF1A1A1A" } },
      bottom: { style: "medium", color: { argb: "FF1A1A1A" } },
      left: { style: "thin", color: { argb: "FF27272A" } },
      right: { style: "thin", color: { argb: "FF27272A" } },
    };
  });

  // 4. Data Rows
  let currentRowIndex = 8;
  for (const ev of sorted) {
    const row = sheet.getRow(currentRowIndex);
    const parsedDate = parseISO(ev.shoot_date);
    const dateFormatted = format(parsedDate, "yyyy-MM-dd");
    const dayName = format(parsedDate, "EEEE");
    const timeFormatted = formatEventTimeRange(ev.shoot_time, ev.shoot_end_time) || "—";
    const clientName = ev.client_name?.trim() || "—";
    const servicesLabel = formatServicesSummary(ev.services);
    const location = ev.location?.trim() || "—";
    const statusLabel = EVENT_STATUS_LABELS[ev.status] ?? ev.status;
    const paymentLabel = PAYMENT_STATUS_LABELS[normalizePaymentStatus(ev.payment_status)];
    const notes = ev.notes?.trim() || "—";

    row.values = [
      dateFormatted,
      dayName,
      timeFormatted,
      ev.title,
      clientName,
      servicesLabel,
      location,
      statusLabel,
      paymentLabel,
      notes,
    ];

    const isEven = (currentRowIndex - 8) % 2 === 1;
    const bgArgb = isEven ? "FFFAFAFA" : "FFFFFFFF";

    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Helvetica", size: 9, color: { argb: "FF27272A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgArgb },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: c <= 3 || c === 8 || c === 9 ? "center" : "left",
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE4E4E7" } },
        bottom: { style: "thin", color: { argb: "FFE4E4E7" } },
        left: { style: "thin", color: { argb: "FFE4E4E7" } },
        right: { style: "thin", color: { argb: "FFE4E4E7" } },
      };

      // Subtle font emphasis for status
      if (c === 8) {
        if (ev.status === "delivered") {
          cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FF15803D" } };
        } else if (ev.status === "editing") {
          cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FFB45309" } };
        } else if (ev.status === "shot") {
          cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FF7C3AED" } };
        } else if (ev.status === "scheduled") {
          cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FF2563EB" } };
        }
      }

      if (c === 9) {
        const normPay = normalizePaymentStatus(ev.payment_status);
        if (normPay === "paid_in_full") {
          cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FF15803D" } };
        } else if (normPay === "deposit_paid") {
          cell.font = { name: "Helvetica", size: 9, bold: true, color: { argb: "FFB45309" } };
        }
      }
    }

    row.height = 22;
    currentRowIndex++;
  }

  // 5. Download buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = opts?.filename ?? `shoot-schedule-${format(new Date(), "yyyy-MM")}.xlsx`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
