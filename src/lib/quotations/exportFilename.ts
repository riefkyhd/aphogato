import type { QuotationDraft } from "@/lib/quotations/types";

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Client label for filenames: initials for multi-word names, otherwise first name. */
export function clientNameForExport(clientName: string): string {
  const trimmed = clientName.trim();
  if (!trimmed) return "client";

  const words = trimmed.split(/[\s&,/+]+/).filter((word) => word.length > 0);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  }

  return sanitizeFilenamePart(words[0]) || "client";
}

export function buildQuotationExportFilename(draft: QuotationDraft): string {
  const quoteNumber = sanitizeFilenamePart(draft.quoteNumber.trim()) || "quotation";
  const client = clientNameForExport(draft.clientName);
  return `${quoteNumber}-${client}.pdf`;
}
