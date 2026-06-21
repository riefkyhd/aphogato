import { addDays, format } from "date-fns";
import type { InvoiceDraft } from "@/lib/invoices/types";
import { createEmptyLineItem } from "@/lib/quotations/defaults";

export const DEFAULT_INVOICE_TERMS =
  "This invoice is for the remaining balance after your deposit on the referenced quotation. Payment is due by the due date above so final photos can be delivered. What was agreed is listed in the quotation and deliverables above. Copyright stays with Muhammad Hadid until this balance is received in full.";

export function createBlankInvoice(): InvoiceDraft {
  const now = new Date();
  return {
    invoiceNumber: "",
    invoiceDate: format(now, "yyyy-MM-dd"),
    dueDate: format(addDays(now, 7), "yyyy-MM-dd"),
    quoteNumber: "",
    quotationId: null,
    clientName: "",
    clientPhone: "",
    clientSocial: "",
    projectTitle: "",
    eventDate: "",
    eventLocation: "",
    eventDuration: "",
    deliverables: [],
    lineItems: [createEmptyLineItem()],
    depositPaid: 0,
    notes: "",
    terms: DEFAULT_INVOICE_TERMS,
  };
}
