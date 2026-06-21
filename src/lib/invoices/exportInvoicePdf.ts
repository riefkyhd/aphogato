import { buildInvoiceExportFilename } from "@/lib/invoices/exportFilename";
import type { InvoiceDraft } from "@/lib/invoices/types";
import {
  canvasSizeToMm,
  renderQuotationCanvas,
} from "@/lib/quotations/quotationCapture";

export async function exportInvoicePdf(
  draft: InvoiceDraft,
  element: HTMLElement
): Promise<void> {
  const items = draft.lineItems.filter((item) => item.description.trim());
  if (items.length === 0) {
    throw new Error("Add at least one line item with a description");
  }

  const canvas = await renderQuotationCanvas(element);
  const imgData = canvas.toDataURL("image/png", 1);
  const { widthMm, heightMm } = canvasSizeToMm(canvas);

  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    unit: "mm",
    format: [widthMm, heightMm],
    orientation: "portrait",
  });

  pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm);
  pdf.save(buildInvoiceExportFilename(draft));
}
