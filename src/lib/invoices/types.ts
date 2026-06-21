import type {
  QuotationDeliverable,
  QuotationLineItem,
} from "@/lib/quotations/types";

export type InvoiceDraft = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  quoteNumber: string;
  quotationId: string | null;
  clientName: string;
  clientPhone: string;
  clientSocial: string;
  projectTitle: string;
  eventDate: string;
  eventLocation: string;
  eventDuration: string;
  deliverables: QuotationDeliverable[];
  lineItems: QuotationLineItem[];
  depositPaid: number;
  notes: string;
  terms: string;
};
