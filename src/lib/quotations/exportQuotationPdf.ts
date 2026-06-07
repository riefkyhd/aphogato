import { format, parseISO } from "date-fns";
import { buildQuotationExportFilename } from "@/lib/quotations/exportFilename";
import {
  quotationDownPayment,
  quotationSubtotal,
} from "@/lib/quotations/calculations";
import type { QuotationDraft } from "@/lib/quotations/types";
import { formatMoney } from "@/lib/finance/formatMoney";
import {
  QUOTATION_BANK_ACCOUNTS,
  quotationBalance,
} from "@/lib/quotations/payment";

function formatQuoteDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMMM yyyy");
  } catch {
    return iso;
  }
}

export async function exportQuotationPdf(draft: QuotationDraft) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (height: number) => {
    if (y + height > 285) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.text("MH", margin, y);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("MUHAMMAD HADID", margin + 10, y - 1);
  doc.text("Photography", margin + 10, y + 3);
  y += 14;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Quotation", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(90);
  const meta = [
    draft.quoteNumber ? `No. ${draft.quoteNumber}` : null,
    draft.quoteDate ? `Date ${formatQuoteDate(draft.quoteDate)}` : null,
    draft.validUntil ? `Valid until ${formatQuoteDate(draft.validUntil)}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (meta) {
    doc.text(meta, margin, y);
    y += 8;
  }

  if (
    draft.clientName.trim() ||
    draft.clientPhone.trim() ||
    draft.clientSocial.trim()
  ) {
    doc.setTextColor(40);
    doc.setFontSize(10);
    if (draft.clientName.trim()) {
      doc.text(`Prepared for  ${draft.clientName.trim()}`, margin, y);
      y += 5;
    }
    if (draft.clientPhone.trim()) {
      doc.setTextColor(100);
      doc.text(draft.clientPhone.trim(), margin, y);
      y += 5;
    }
    if (draft.clientSocial.trim()) {
      doc.setTextColor(100);
      doc.text(draft.clientSocial.trim(), margin, y);
      y += 5;
    }
    y += 2;
  }

  const eventMeta = [
    draft.projectTitle.trim()
      ? `Event  ${draft.projectTitle.trim()}`
      : null,
    draft.eventDate.trim()
      ? `Event date  ${formatQuoteDate(draft.eventDate)}`
      : null,
    draft.eventLocation.trim()
      ? `Location  ${draft.eventLocation.trim()}`
      : null,
    draft.eventDuration.trim()
      ? `Duration  ${draft.eventDuration.trim()}`
      : null,
  ].filter(Boolean);

  if (eventMeta.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(90);
    for (const line of eventMeta) {
      doc.text(line!, margin, y);
      y += 4.5;
    }
    y += 4;
  }

  const deliverables = draft.deliverables.filter((d) => d.description.trim());
  if (deliverables.length > 0) {
    addPageIfNeeded(16);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Deliverables", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(60);
    for (const item of deliverables) {
      const lines = doc.splitTextToSize(
        `- ${item.description.trim()}`,
        contentWidth
      );
      addPageIfNeeded(lines.length * 4 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 4 + 2;
    }
    y += 4;
  }

  const items = draft.lineItems.filter((i) => i.description.trim());
  if (items.length === 0) {
    throw new Error("Add at least one line item with a description");
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Description", margin, y);
  doc.text("Qty", margin + contentWidth - 58, y, { align: "right" });
  doc.text("Rate", margin + contentWidth - 38, y, { align: "right" });
  doc.text("Amount", margin + contentWidth, y, { align: "right" });
  y += 4;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(30);

  for (const item of items) {
    const amount = item.qty * item.unitPrice;
    const descLines = doc.splitTextToSize(item.description.trim(), contentWidth - 70);
    const rowHeight = Math.max(descLines.length * 4.5, 6);
    addPageIfNeeded(rowHeight + 4);

    doc.text(descLines, margin, y);
    doc.text(String(item.qty), margin + contentWidth - 58, y, { align: "right" });
    doc.text(formatMoney(item.unitPrice), margin + contentWidth - 38, y, {
      align: "right",
    });
    doc.text(formatMoney(amount), margin + contentWidth, y, { align: "right" });
    y += rowHeight + 3;
  }

  y += 4;
  doc.setDrawColor(200);
  doc.line(margin + contentWidth - 70, y, pageWidth - margin, y);
  y += 7;

  const total = quotationSubtotal(items);
  const downPayment = quotationDownPayment(items);
  const balance = quotationBalance(items);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total", margin + contentWidth - 38, y, { align: "right" });
  doc.text(formatMoney(total), margin + contentWidth, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text("Down payment (50%)", margin + contentWidth - 38, y, {
    align: "right",
  });
  doc.setTextColor(30);
  doc.text(formatMoney(downPayment), margin + contentWidth, y, { align: "right" });
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(100);
  const dpNote = doc.splitTextToSize(
    "Non-refundable. Required to secure the booking date.",
    contentWidth * 0.55
  );
  doc.text(dpNote, margin + contentWidth - 55, y, { align: "right" });
  y += dpNote.length * 3.5 + 4;

  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text("Balance", margin + contentWidth - 38, y, { align: "right" });
  doc.setTextColor(30);
  doc.text(formatMoney(balance), margin + contentWidth, y, { align: "right" });
  y += 4;

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "Due before final delivery of edited images.",
    margin + contentWidth,
    y,
    { align: "right" }
  );
  y += 10;

  addPageIfNeeded(28);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Payment", margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("Transfer the down payment to one of the accounts below.", margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(50);
  for (const account of QUOTATION_BANK_ACCOUNTS) {
    doc.text(
      `${account.bank}  ·  ${account.name}  ·  ${account.number}`,
      margin,
      y
    );
    y += 4.5;
  }
  y += 6;

  if (draft.notes.trim()) {
    addPageIfNeeded(20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Notes", margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(60);
    const noteLines = doc.splitTextToSize(draft.notes.trim(), contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 8;
  }

  if (draft.terms.trim()) {
    addPageIfNeeded(20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text("Terms", margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(80);
    const termLines = doc.splitTextToSize(draft.terms.trim(), contentWidth);
    doc.text(termLines, margin, y);
    y += termLines.length * 3.5 + 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(130);
  addPageIfNeeded(10);
  doc.text("Indonesia  ·  Available worldwide", margin, y);
  doc.text("muhammad-hadid.com", pageWidth - margin, y, { align: "right" });

  doc.save(buildQuotationExportFilename(draft));
}
