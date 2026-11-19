export type QuotationLineItem = {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
};

export type QuotationDeliverable = {
  id: string;
  description: string;
};

export type QuotationDraft = {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  currency?: string;
  exchangeRateToIdr?: number;
  exchangeRateDate?: string | null;
  clientName: string;
  clientPhone: string;
  clientSocial: string;
  projectTitle: string;
  eventDate: string;
  eventLocation: string;
  eventDuration: string;
  deliverables: QuotationDeliverable[];
  lineItems: QuotationLineItem[];
  notes: string;
  terms: string;
};
