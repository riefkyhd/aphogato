import {
  QUOTATION_PAGE_WIDTH_MM,
  QUOTATION_PAGE_WIDTH_PX,
} from "@/lib/quotations/quotationPage";

const CAPTURE_SCALE = 2;

export function prepareQuotationElementForCapture(element: HTMLElement): void {
  element.style.boxShadow = "none";
  element.style.borderRadius = "0";
  element.style.overflow = "visible";
  element.style.width = `${QUOTATION_PAGE_WIDTH_PX}px`;
  element.style.maxWidth = `${QUOTATION_PAGE_WIDTH_PX}px`;
}

export function restoreQuotationElementAfterCapture(
  element: HTMLElement,
  previous: { boxShadow: string; borderRadius: string; overflow: string; width: string; maxWidth: string }
): void {
  element.style.boxShadow = previous.boxShadow;
  element.style.borderRadius = previous.borderRadius;
  element.style.overflow = previous.overflow;
  element.style.width = previous.width;
  element.style.maxWidth = previous.maxWidth;
}

export function readQuotationInlineStyles(element: HTMLElement) {
  return {
    boxShadow: element.style.boxShadow,
    borderRadius: element.style.borderRadius,
    overflow: element.style.overflow,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
  };
}

async function waitForImages(root: HTMLElement): Promise<void> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

export async function renderQuotationCanvas(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  element.scrollIntoView({ block: "nearest", inline: "nearest" });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  await waitForImages(element);

  const html2canvas = (await import("html2canvas")).default;

  return html2canvas(element, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: QUOTATION_PAGE_WIDTH_PX,
    windowWidth: QUOTATION_PAGE_WIDTH_PX,
    onclone: (_doc, clone) => {
      if (!(clone instanceof HTMLElement)) return;
      clone.style.boxShadow = "none";
      clone.style.borderRadius = "0";
      clone.style.overflow = "visible";
      clone.style.width = `${QUOTATION_PAGE_WIDTH_PX}px`;
      clone.style.maxWidth = `${QUOTATION_PAGE_WIDTH_PX}px`;
      clone.style.margin = "0";
    },
  });
}

/** Map canvas pixels to millimetres using the fixed A4 document width. */
export function canvasSizeToMm(canvas: HTMLCanvasElement): {
  widthMm: number;
  heightMm: number;
} {
  const widthMm = QUOTATION_PAGE_WIDTH_MM;
  const heightMm = (canvas.height / canvas.width) * widthMm;
  return { widthMm, heightMm };
}

export { CAPTURE_SCALE };
