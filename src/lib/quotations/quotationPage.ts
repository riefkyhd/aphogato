/** Quotation documents use ISO A4 (standard for client PDFs and printing). */
export const QUOTATION_PAGE_FORMAT = "a4" as const;

export const QUOTATION_PAGE_WIDTH_MM = 210;
export const QUOTATION_PAGE_HEIGHT_MM = 297;

/** A4 width at 96 CSS px/in — used for preview frame and html2canvas capture. */
export const QUOTATION_PAGE_WIDTH_PX = Math.round(
  (QUOTATION_PAGE_WIDTH_MM / 25.4) * 96
);
