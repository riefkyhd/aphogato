import { buildQuotationExportFilename } from "@/lib/quotations/exportFilename";
import {
  canvasSizeToMm,
  prepareQuotationElementForCapture,
  readQuotationInlineStyles,
  renderQuotationCanvas,
  restoreQuotationElementAfterCapture,
} from "@/lib/quotations/quotationCapture";
import { QUOTATION_PAGE_HEIGHT_MM } from "@/lib/quotations/quotationPage";
import type { QuotationDraft } from "@/lib/quotations/types";

/**
 * Builds a PDF from the live preview element at 1:1 scale — no squash/stretch.
 * Page height matches content on single-page quotes; multi-page uses exact slices.
 */
export async function exportQuotationPdf(
  draft: QuotationDraft,
  element: HTMLElement
): Promise<void> {
  const items = draft.lineItems.filter((i) => i.description.trim());
  if (items.length === 0) {
    throw new Error("Add at least one line item with a description");
  }

  const previousStyles = readQuotationInlineStyles(element);
  prepareQuotationElementForCapture(element);

  try {
    const canvas = await renderQuotationCanvas(element);
    const imgData = canvas.toDataURL("image/png", 1);
    const { widthMm, heightMm } = canvasSizeToMm(canvas);
    const pageWidthMm = widthMm;
    const pageHeightMm = QUOTATION_PAGE_HEIGHT_MM;

    const { jsPDF } = await import("jspdf");

    if (heightMm <= pageHeightMm + 0.01) {
      const pdf = new jsPDF({
        unit: "mm",
        format: [pageWidthMm, heightMm],
        orientation: "portrait",
      });
      pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, heightMm);
      pdf.save(buildQuotationExportFilename(draft));
      return;
    }

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    let offsetMm = 0;
    let pageIndex = 0;

    while (offsetMm < heightMm - 0.01) {
      const remainingMm = heightMm - offsetMm;
      const sliceMm = Math.min(pageHeightMm, remainingMm);
      const isLastSlice = remainingMm <= pageHeightMm + 0.01;

      if (pageIndex > 0) {
        pdf.addPage(
          isLastSlice && sliceMm < pageHeightMm
            ? [pageWidthMm, sliceMm]
            : "a4"
        );
      }

      pdf.addImage(imgData, "PNG", 0, -offsetMm, pageWidthMm, heightMm);
      offsetMm += pageHeightMm;
      pageIndex += 1;
    }

    pdf.save(buildQuotationExportFilename(draft));
  } finally {
    restoreQuotationElementAfterCapture(element, previousStyles);
  }
}
