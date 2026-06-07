import { buildQuotationExportFilename } from "@/lib/quotations/exportFilename";
import {
  canvasSizeToMm,
  renderQuotationCanvas,
} from "@/lib/quotations/quotationCapture";
import type { QuotationDraft } from "@/lib/quotations/types";

/**
 * Captures the live preview element with html2canvas and downloads a PDF.
 * Capture styles are applied only to the html2canvas clone — the on-screen
 * preview is never modified, so scroll position and layout stay stable.
 */
export async function exportQuotationPdf(
  draft: QuotationDraft,
  element: HTMLElement
): Promise<void> {
  const items = draft.lineItems.filter((i) => i.description.trim());
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
  pdf.save(buildQuotationExportFilename(draft));
}
