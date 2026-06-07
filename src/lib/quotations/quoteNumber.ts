import { format } from "date-fns";
import type { SavedQuotation } from "@/lib/quotations/db";

const BASE_QUOTE_RE = /^MH-(\d{6})-(\d{4})$/;
const REVISION_QUOTE_RE = /^MH-(\d{6})-(\d{4})-rev(\d+)$/;

export function formatBaseQuoteNumber(date: Date, seq: number): string {
  return `MH-${format(date, "yyyyMM")}-${String(seq).padStart(4, "0")}`;
}

export function parseBaseQuoteNumber(quoteNumber: string): {
  yearMonth: string;
  seq: number;
} | null {
  const trimmed = quoteNumber.trim();
  const baseMatch = trimmed.match(BASE_QUOTE_RE);
  if (baseMatch) {
    return { yearMonth: baseMatch[1], seq: Number(baseMatch[2]) };
  }

  const revisionMatch = trimmed.match(REVISION_QUOTE_RE);
  if (revisionMatch) {
    return { yearMonth: revisionMatch[1], seq: Number(revisionMatch[2]) };
  }

  return null;
}

export function getBaseQuoteLabel(quoteNumber: string): string {
  const match = quoteNumber.trim().match(/^(MH-\d{6}-\d{4})/);
  return match?.[1] ?? quoteNumber.trim();
}

export function getQuotationRootId(item: Pick<SavedQuotation, "id" | "parent_id">) {
  return item.parent_id ?? item.id;
}

export function peekNextBaseQuoteNumber(
  items: Pick<SavedQuotation, "quote_number">[],
  date = new Date()
): string {
  const yearMonth = format(date, "yyyyMM");
  let maxSeq = 0;

  for (const item of items) {
    const parsed = parseBaseQuoteNumber(item.quote_number);
    if (parsed?.yearMonth === yearMonth) {
      maxSeq = Math.max(maxSeq, parsed.seq);
    }
  }

  return formatBaseQuoteNumber(date, maxSeq + 1);
}

export function peekNextRevisionQuoteNumber(
  source: Pick<SavedQuotation, "id" | "parent_id" | "quote_number" | "revision">,
  items: Pick<SavedQuotation, "id" | "parent_id" | "quote_number" | "revision">[]
): { quoteNumber: string; parentId: string; revision: number } {
  const parentId = getQuotationRootId(source);
  const baseQuote = getBaseQuoteLabel(source.quote_number);

  let maxRevision = 0;
  for (const item of items) {
    if (getQuotationRootId(item) !== parentId) continue;
    maxRevision = Math.max(maxRevision, item.revision);

    const revMatch = item.quote_number.match(/-rev(\d+)$/);
    if (revMatch) {
      maxRevision = Math.max(maxRevision, Number(revMatch[1]));
    }
  }

  const nextRevision = maxRevision + 1;
  return {
    quoteNumber: `${baseQuote}-rev${nextRevision}`,
    parentId,
    revision: nextRevision,
  };
}

export function isRevisionQuoteNumber(quoteNumber: string): boolean {
  return REVISION_QUOTE_RE.test(quoteNumber.trim());
}
