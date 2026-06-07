import { buildQuotationExportFilename } from "@/lib/quotations/exportFilename";
import type { QuotationDraft } from "@/lib/quotations/types";

/** A4 width at 96dpi — matches print layout for the preview component. */
export const QUOTATION_PDF_CAPTURE_WIDTH_PX = 794;

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

/**
 * Renders the on-screen quotation preview into a PDF so export matches preview.
 */
export async function exportQuotationPdf(
  draft: QuotationDraft,
  element: HTMLElement
): Promise<void> {
  const items = draft.lineItems.filter((i) => i.description.trim());
  if (items.length === 0) {
    throw new Error("Add at least one line item with a description");
  }

  await waitForImages(element);

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(buildQuotationExportFilename(draft));
}
