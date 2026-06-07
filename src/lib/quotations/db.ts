import { quotationSubtotal } from "@/lib/quotations/calculations";
import {
  createEmptyDeliverable,
  createEmptyLineItem,
} from "@/lib/quotations/defaults";
import type {
  QuotationDeliverable,
  QuotationDraft,
  QuotationLineItem,
} from "@/lib/quotations/types";

export type SavedQuotation = {
  id: string;
  quote_number: string;
  quote_date: string | null;
  valid_until: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_social: string | null;
  project_title: string | null;
  event_date: string | null;
  event_location: string | null;
  event_duration: string | null;
  line_items: QuotationLineItem[];
  deliverables: QuotationDeliverable[];
  notes: string | null;
  terms: string | null;
  subtotal: number;
  parent_id: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
};

export type QuotationSaveOptions = {
  parentId?: string | null;
  revision?: number;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function draftToInsertPayload(
  draft: QuotationDraft,
  options: QuotationSaveOptions = {}
) {
  const quoteNumber = draft.quoteNumber.trim();
  if (!quoteNumber) {
    throw new Error("Quote number is required");
  }

  const lineItems = draft.lineItems.filter((item) => item.description.trim());
  if (lineItems.length === 0) {
    throw new Error("Add at least one line item with a description");
  }

  const revision = options.revision ?? 0;

  return {
    quote_number: quoteNumber,
    quote_date: draft.quoteDate || null,
    valid_until: draft.validUntil || null,
    client_name: emptyToNull(draft.clientName),
    client_phone: emptyToNull(draft.clientPhone),
    client_social: emptyToNull(draft.clientSocial),
    project_title: emptyToNull(draft.projectTitle),
    event_date: draft.eventDate || null,
    event_location: emptyToNull(draft.eventLocation),
    event_duration: emptyToNull(draft.eventDuration),
    line_items: lineItems,
    deliverables: draft.deliverables.filter((item) => item.description.trim()),
    notes: emptyToNull(draft.notes),
    terms: emptyToNull(draft.terms),
    subtotal: quotationSubtotal(lineItems),
    parent_id: options.parentId ?? null,
    revision,
    updated_at: new Date().toISOString(),
  };
}

export function normalizeQuotation(row: Record<string, unknown>): SavedQuotation {
  return {
    id: String(row.id),
    quote_number: String(row.quote_number),
    quote_date: row.quote_date ? String(row.quote_date) : null,
    valid_until: row.valid_until ? String(row.valid_until) : null,
    client_name: row.client_name ? String(row.client_name) : null,
    client_phone: row.client_phone ? String(row.client_phone) : null,
    client_social: row.client_social ? String(row.client_social) : null,
    project_title: row.project_title ? String(row.project_title) : null,
    event_date: row.event_date ? String(row.event_date) : null,
    event_location: row.event_location ? String(row.event_location) : null,
    event_duration: row.event_duration ? String(row.event_duration) : null,
    line_items: Array.isArray(row.line_items)
      ? (row.line_items as QuotationLineItem[])
      : [],
    deliverables: Array.isArray(row.deliverables)
      ? (row.deliverables as QuotationDeliverable[])
      : [],
    notes: row.notes ? String(row.notes) : null,
    terms: row.terms ? String(row.terms) : null,
    subtotal: Number(row.subtotal),
    parent_id: row.parent_id ? String(row.parent_id) : null,
    revision: Number(row.revision ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function savedQuotationToDraft(row: SavedQuotation): QuotationDraft {
  return {
    quoteNumber: row.quote_number,
    quoteDate: row.quote_date ?? "",
    validUntil: row.valid_until ?? "",
    clientName: row.client_name ?? "",
    clientPhone: row.client_phone ?? "",
    clientSocial: row.client_social ?? "",
    projectTitle: row.project_title ?? "",
    eventDate: row.event_date ?? "",
    eventLocation: row.event_location ?? "",
    eventDuration: row.event_duration ?? "",
    deliverables:
      row.deliverables.length > 0
        ? row.deliverables
        : [createEmptyDeliverable()],
    lineItems:
      row.line_items.length > 0 ? row.line_items : [createEmptyLineItem()],
    notes: row.notes ?? "",
    terms: row.terms ?? "",
  };
}
