import {
  createBlankQuotation,
  createEmptyDeliverable,
} from "@/lib/quotations/defaults";
import {
  type SavedQuotation,
  savedQuotationToDraft,
} from "@/lib/quotations/db";
import { peekNextBaseQuoteNumber } from "@/lib/quotations/quoteNumber";
import type { QuotationDraft } from "@/lib/quotations/types";

export type QuotationSessionSnapshot = {
  draft: QuotationDraft;
  savedId: string | null;
  revisionParentId: string | null;
  draftRevision: number;
};

function normalizeDraft(
  parsed: QuotationDraft & { clientEmail?: string }
): QuotationDraft {
  return {
    ...parsed,
    clientPhone: parsed.clientPhone ?? "",
    clientSocial: parsed.clientSocial ?? parsed.clientEmail ?? "",
    eventDate: parsed.eventDate ?? "",
    eventLocation: parsed.eventLocation ?? "",
    eventDuration: parsed.eventDuration ?? "",
    deliverables:
      parsed.deliverables?.length > 0
        ? parsed.deliverables
        : [createEmptyDeliverable()],
  };
}

function snapshotFromSaved(row: SavedQuotation): QuotationSessionSnapshot {
  return {
    draft: savedQuotationToDraft(row),
    savedId: row.id,
    revisionParentId: row.parent_id,
    draftRevision: row.revision,
  };
}

export function parseStoredQuotationSession(
  raw: string
): QuotationSessionSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    if ("draft" in parsed && parsed.draft && typeof parsed.draft === "object") {
      const stored = parsed as {
        draft: QuotationDraft & { clientEmail?: string };
        savedId?: unknown;
        revisionParentId?: unknown;
        draftRevision?: unknown;
      };
      const draft = normalizeDraft(stored.draft);
      if (!draft.lineItems?.length) return null;
      return {
        draft,
        savedId: typeof stored.savedId === "string" ? stored.savedId : null,
        revisionParentId:
          typeof stored.revisionParentId === "string"
            ? stored.revisionParentId
            : null,
        draftRevision:
          typeof stored.draftRevision === "number" ? stored.draftRevision : 0,
      };
    }

    const legacy = parsed as QuotationDraft & { clientEmail?: string };
    if (!legacy.lineItems?.length) return null;
    return {
      draft: normalizeDraft(legacy),
      savedId: null,
      revisionParentId: null,
      draftRevision: 0,
    };
  } catch {
    return null;
  }
}

export function resolveRestoredQuotationSession(
  snapshot: QuotationSessionSnapshot,
  savedQuotations: SavedQuotation[]
): QuotationSessionSnapshot {
  if (snapshot.savedId) {
    const row = savedQuotations.find((q) => q.id === snapshot.savedId);
    if (row) return snapshotFromSaved(row);
  }

  const byNumber = savedQuotations.find(
    (q) => q.quote_number === snapshot.draft.quoteNumber.trim()
  );
  if (byNumber) {
    return snapshotFromSaved(byNumber);
  }

  return snapshot;
}

export function blankQuotationSession(
  savedQuotations: SavedQuotation[]
): QuotationSessionSnapshot {
  return {
    draft: createBlankQuotation(peekNextBaseQuoteNumber(savedQuotations)),
    savedId: null,
    revisionParentId: null,
    draftRevision: 0,
  };
}

export function serializeQuotationSession(
  snapshot: QuotationSessionSnapshot
): string {
  return JSON.stringify(snapshot);
}
