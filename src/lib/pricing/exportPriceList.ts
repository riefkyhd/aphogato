import { format } from "date-fns";
import { formatMoney } from "@/lib/finance/formatMoney";
import type { PriceListItem } from "@/lib/types";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map((c) => csvEscape(String(c))).join(",");
}

export function formatPriceListCsv(items: PriceListItem[]): string {
  const active = items.filter((i) => i.active);
  const lines: string[] = [
    csvRow(["Aphogato Studio Price List"]),
    csvRow(["Generated", format(new Date(), "yyyy-MM-dd HH:mm")]),
    "",
    csvRow(["Service", "Category", "Price (IDR)", "Notes"]),
  ];

  if (active.length === 0) {
    lines.push(csvRow(["—", "—", "—", "—"]));
  } else {
    for (const item of active) {
      lines.push(
        csvRow([
          item.name,
          item.category ?? "",
          item.amount,
          item.notes ?? "",
        ])
      );
    }
  }

  return lines.join("\n") + "\n";
}

export function downloadPriceListCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `price-list-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function exportPriceListPdf(items: PriceListItem[]) {
  const active = items.filter((i) => i.active);
  if (active.length === 0) {
    throw new Error("No active price list items to export");
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  let y = margin;

  doc.setFontSize(18);
  doc.text("Studio Price List", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${format(new Date(), "MMM d, yyyy")}`, margin, y);
  doc.setTextColor(0);
  y += 12;

  doc.setFontSize(11);
  for (const item of active) {
    if (y > 275) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.text(item.name, margin, y);
    const nameWidth = doc.getTextWidth(item.name);
    doc.setFont("helvetica", "normal");
    doc.text(formatMoney(item.amount), margin + nameWidth + 4, y);
    y += 5;

    if (item.category?.trim()) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(item.category.trim(), margin, y);
      doc.setTextColor(0);
      doc.setFontSize(11);
      y += 5;
    }

    if (item.notes?.trim()) {
      doc.setFontSize(9);
      doc.setTextColor(90);
      const lines = doc.splitTextToSize(item.notes.trim(), 180);
      doc.text(lines, margin, y);
      doc.setTextColor(0);
      doc.setFontSize(11);
      y += lines.length * 4 + 2;
    }

    y += 4;
  }

  doc.save(`price-list-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
