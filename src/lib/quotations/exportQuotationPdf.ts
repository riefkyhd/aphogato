import { buildQuotationExportFilename } from "@/lib/quotations/exportFilename";
import { QUOTATION_PAGE_WIDTH_PX } from "@/lib/quotations/quotationPage";
import type { QuotationDraft } from "@/lib/quotations/types";

function isFirefox(): boolean {
  return /firefox/i.test(navigator.userAgent);
}

function collectStylesheetLinks(): string {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  )
    .map((link) => `<link rel="stylesheet" href="${link.href}" />`)
    .join("\n");
}

/** Strip print rules that hide body children — they blank the iframe export. */
function sanitizeCssForPrintFrame(css: string): string {
  return css.replace(
    /body\s*>\s*\*:not\(\s*iframe\s*\)\s*\{[^}]*\}/gi,
    ""
  );
}

function collectInlineCss(): string {
  const cssTexts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join("\n");
      cssTexts.push(rules);
    } catch {
      if (sheet.href) {
        cssTexts.push(`@import url("${sheet.href}");`);
      }
    }
  }

  return sanitizeCssForPrintFrame(cssTexts.join("\n"));
}

function prepareClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  clone.style.transform = "none";
  clone.style.zoom = "1";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.width = `${QUOTATION_PAGE_WIDTH_PX}px`;
  clone.style.maxWidth = `${QUOTATION_PAGE_WIDTH_PX}px`;
  clone.style.overflow = "visible";

  for (const img of clone.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (src?.startsWith("/")) {
      img.setAttribute("src", `${window.location.origin}${src}`);
    }
  }

  return clone;
}

async function waitForIframeReady(iframeDoc: Document): Promise<void> {
  const links = Array.from(
    iframeDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  );

  await Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          if (link.sheet) {
            resolve();
            return;
          }
          link.addEventListener("load", () => resolve(), { once: true });
          link.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, 3000);
        })
    )
  );

  if (iframeDoc.fonts?.ready) {
    await iframeDoc.fonts.ready;
  }

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

const PRINT_FRAME_OVERRIDES = `
  @page {
    size: 210mm auto;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }

  @media print {
    body.quotation-print-root > .quotation-document {
      display: block !important;
      visibility: visible !important;
    }
  }
`;

/**
 * Opens the browser print dialog with a cloned quotation rendered in a hidden
 * iframe — uses the native print engine for WYSIWYG output (Save as PDF).
 */
export async function exportQuotationPdf(
  draft: QuotationDraft,
  element: HTMLElement
): Promise<void> {
  const items = draft.lineItems.filter((i) => i.description.trim());
  if (items.length === 0) {
    throw new Error("Add at least one line item with a description");
  }

  if (isFirefox()) {
    throw new Error(
      "For best results, use Chrome or Safari to export PDF."
    );
  }

  const filename = buildQuotationExportFilename(draft);
  const originalTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, "");

  const clone = prepareClone(element);
  const stylesheetLinks = collectStylesheetLinks();
  const inlineCss = collectInlineCss();

  const iframe = document.createElement("iframe");
  iframe.style.cssText = [
    "position:fixed",
    "top:-99999px",
    "left:-99999px",
    "width:210mm",
    "height:1px",
    "border:none",
    "opacity:0",
    "pointer-events:none",
  ].join(";");

  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument;
    const iframeWindow = iframe.contentWindow;
    if (!iframeDoc || !iframeWindow) {
      throw new Error("Print frame not available");
    }

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${stylesheetLinks}
  <style>
    ${inlineCss}
    ${PRINT_FRAME_OVERRIDES}
  </style>
</head>
<body class="quotation-print-root">
  ${clone.outerHTML}
</body>
</html>`);
    iframeDoc.close();

    await new Promise<void>((resolve) => {
      if (iframeDoc.readyState === "complete") {
        resolve();
        return;
      }
      iframe.addEventListener("load", () => resolve(), { once: true });
      setTimeout(resolve, 2000);
    });

    await waitForIframeReady(iframeDoc);

    iframeWindow.print();
    document.title = originalTitle;
  } finally {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      document.title = originalTitle;
    }, 5000);
  }
}
