import { addDays, format } from "date-fns";
import { nanoid } from "nanoid";
import type {
  QuotationDeliverable,
  QuotationDraft,
  QuotationLineItem,
} from "@/lib/quotations/types";

export const QUOTATION_STORAGE_KEY = "aphogato-quotation-draft-v1";

export const DEFAULT_QUOTATION_TERMS =
  "This quotation is valid until the date above. To secure the booking date, a 50% deposit is required. The deposit is non-refundable. The remaining balance is due before the final photos are delivered. What is included is listed in the deliverables and pricing above. Extra hours, retouching, or travel outside the agreed location will be discussed separately. You may share the photos on social media and print them for personal use. Please ask first if you plan to use them commercially or share them with vendors. Copyright stays with Muhammad Hadid until full payment is received. Selected images may be used for portfolio and social media unless you prefer otherwise.";

export function createEmptyLineItem(): QuotationLineItem {
  return { id: nanoid(), description: "", qty: 1, unitPrice: 0 };
}

export function createEmptyDeliverable(): QuotationDeliverable {
  return { id: nanoid(), description: "" };
}

export function createBlankQuotation(quoteNumber = ""): QuotationDraft {
  const now = new Date();
  return {
    quoteNumber,
    quoteDate: format(now, "yyyy-MM-dd"),
    validUntil: format(addDays(now, 14), "yyyy-MM-dd"),
    clientName: "",
    clientPhone: "",
    clientSocial: "",
    projectTitle: "",
    eventDate: "",
    eventLocation: "",
    eventDuration: "",
    deliverables: [createEmptyDeliverable()],
    lineItems: [createEmptyLineItem()],
    notes: "",
    terms: DEFAULT_QUOTATION_TERMS,
  };
}
