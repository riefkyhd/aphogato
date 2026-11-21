import { addDays, format } from "date-fns";
import { DEFAULT_INVOICE_TERMS, DEFAULT_INVOICE_TERMS_FULL } from "@/lib/invoices/defaults";
import type { InvoiceDraft } from "@/lib/invoices/types";
import { quotationDownPayment } from "@/lib/quotations/calculations";
import type { SavedQuotation } from "@/lib/quotations/db";

export function buildInvoiceNumber(quoteNumber: string): string {
  return `${quoteNumber.trim()}-INV`;
}

export function invoiceFromQuotation(quote: SavedQuotation): InvoiceDraft {
  const lineItems = quote.line_items.filter((item) => item.description.trim());
  const now = new Date();
  const isFullPaymentQuote = quote.payment_terms === "full";
  const depositPaid = isFullPaymentQuote ? 0 : quotationDownPayment(lineItems);
  const paymentMode = isFullPaymentQuote ? "full" : "split";
  const terms = isFullPaymentQuote ? DEFAULT_INVOICE_TERMS_FULL : DEFAULT_INVOICE_TERMS;

  return {
    invoiceNumber: buildInvoiceNumber(quote.quote_number),
    invoiceDate: format(now, "yyyy-MM-dd"),
    dueDate: format(addDays(now, 7), "yyyy-MM-dd"),
    currency: quote.currency || "IDR",
    exchangeRateToIdr: quote.exchange_rate_to_idr || 1,
    exchangeRateDate: quote.exchange_rate_date || null,
    totalIdr: quote.total_idr || null,
    quoteNumber: quote.quote_number,
    quotationId: quote.id,
    clientName: quote.client_name ?? "",
    clientPhone: quote.client_phone ?? "",
    clientSocial: quote.client_social ?? "",
    projectTitle: quote.project_title ?? "",
    eventDate: quote.event_date ?? "",
    eventLocation: quote.event_location ?? "",
    eventDuration: quote.event_duration ?? "",
    deliverables: quote.deliverables,
    lineItems,
    paymentMode,
    depositPaid,
    notes: "",
    terms,
  };
}
