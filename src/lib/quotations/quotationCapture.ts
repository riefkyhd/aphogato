import {
  QUOTATION_PAGE_WIDTH_MM,
  QUOTATION_PAGE_WIDTH_PX,
} from "@/lib/quotations/quotationPage";

const CAPTURE_SCALE = 2;

const QUOTATION_LOGO_ROW_HEIGHT_PX = 48;

function measureBrandTextPaddingTops(
  element: HTMLElement
): Map<HTMLElement, number> {
  const paddingTops = new Map<HTMLElement, number>();

  element.querySelectorAll(".quotation-brand-text").forEach((textNode) => {
    if (!(textNode instanceof HTMLElement)) return;

    const textHeight = textNode.getBoundingClientRect().height;
    const paddingTop = Math.max(
      0,
      Math.round((QUOTATION_LOGO_ROW_HEIGHT_PX - textHeight) / 2)
    );

    paddingTops.set(textNode, paddingTop);
  });

  return paddingTops;
}

function applyCaptureHeaderAlignment(
  root: HTMLElement,
  paddingTops: Map<HTMLElement, number>
): void {
  root.querySelectorAll(".quotation-header-row").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.display = "flex";
    node.style.alignItems = "center";
    node.style.justifyContent = "space-between";
    node.style.gap = "16px";
    node.style.width = "100%";
    node.style.maxWidth = "100%";
    node.style.boxSizing = "border-box";
  });

  root.querySelectorAll(".quotation-brand").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.flex = "1 1 auto";
    node.style.minWidth = "0";
    node.style.maxWidth = "58%";
  });

  root.querySelectorAll(".quotation-header-meta").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.flex = "0 1 auto";
    node.style.minWidth = "0";
    node.style.maxWidth = "42%";
    node.style.textAlign = "right";
    node.style.overflowWrap = "anywhere";
    node.style.wordBreak = "break-all";
  });

  root.querySelectorAll(".quotation-brand-table").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.borderCollapse = "collapse";
    node.style.borderSpacing = "0";
    node.style.height = "48px";
  });

  root.querySelectorAll(".quotation-brand-table tr").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.height = "48px";
  });

  root.querySelectorAll(".quotation-logo-cell").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.verticalAlign = "middle";
    node.style.padding = "0";
    node.style.width = "48px";
    node.style.paddingRight = "12px";
    node.style.height = `${QUOTATION_LOGO_ROW_HEIGHT_PX}px`;
  });

  root.querySelectorAll(".quotation-brand-text-cell").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.verticalAlign = "top";
    node.style.padding = "0";
    node.style.height = `${QUOTATION_LOGO_ROW_HEIGHT_PX}px`;
  });

  const cloneTexts = Array.from(
    root.querySelectorAll(".quotation-brand-text")
  );
  const sourceTexts = Array.from(
    paddingTops.keys()
  );

  cloneTexts.forEach((textNode, index) => {
    if (!(textNode instanceof HTMLElement)) return;

    const sourceText = sourceTexts[index];
    const paddingTop = sourceText ? paddingTops.get(sourceText) ?? 0 : 0;

    textNode.style.display = "block";
    textNode.style.lineHeight = "1.25";
    textNode.style.paddingTop = `${paddingTop}px`;
    textNode.style.marginTop = "0";
    textNode.style.verticalAlign = "top";
  });
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
  await waitForImages(element);

  const brandTextPaddingTops = measureBrandTextPaddingTops(element);

  const html2canvas = (await import("html2canvas")).default;

  const canvasWidth = QUOTATION_PAGE_WIDTH_PX;
  const canvasHeight = element.scrollHeight;
  const { scrollX, scrollY } = readPageScrollOffsets();

  return html2canvas(element, {
    scale: CAPTURE_SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: canvasWidth,
    height: canvasHeight,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    scrollX: -scrollX,
    scrollY: -scrollY,
    x: 0,
    y: 0,
    onclone: (_doc, clone) => {
      if (!(clone instanceof HTMLElement)) return;
      prepareCloneForCapture(clone, canvasWidth);
      applyCaptureHeaderAlignment(clone, brandTextPaddingTops);
    },
  });
}

function readPageScrollOffsets(): { scrollX: number; scrollY: number } {
  if (typeof window === "undefined") {
    return { scrollX: 0, scrollY: 0 };
  }

  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };
}

function prepareCloneForCapture(clone: HTMLElement, canvasWidth: number): void {
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.overflow = "visible";
  clone.style.width = `${canvasWidth}px`;
  clone.style.maxWidth = `${canvasWidth}px`;
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.zoom = "1";
  clone.style.backgroundColor = "#ffffff";
  clone.style.boxSizing = "border-box";

  clone.querySelectorAll(".quotation-logo img").forEach((node) => {
    if (!(node instanceof HTMLImageElement)) return;
    node.style.width = "48px";
    node.style.height = "48px";
    node.style.maxWidth = "48px";
    node.style.maxHeight = "48px";
    node.style.objectFit = "none";
  });
}

export function canvasSizeToMm(canvas: HTMLCanvasElement): {
  widthMm: number;
  heightMm: number;
} {
  const pxToMm =
    QUOTATION_PAGE_WIDTH_MM / (QUOTATION_PAGE_WIDTH_PX * CAPTURE_SCALE);

  return {
    widthMm: canvas.width * pxToMm,
    heightMm: canvas.height * pxToMm,
  };
}

export { CAPTURE_SCALE };
