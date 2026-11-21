import { describe, expect, it } from "vitest";
import { invoiceFromQuotation } from "@/lib/invoices/fromQuotation";
import type { SavedQuotation } from "@/lib/quotations/db";

const baseQuote: SavedQuotation = {
  id: "quote-test-1",
  quote_number: "MH-202611-0005",
  quote_date: "2026-11-20",
  valid_until: "2026-12-04",
  currency: "IDR",
  exchange_rate_to_idr: 1,
  exchange_rate_date: null,
  total_idr: 10000000,
  client_name: "Syaza Samir",
  client_phone: "0811223344",
  client_social: "@syaza",
  project_title: "Pre-wedding Shoot",
  event_date: "2026-12-10",
  event_location: "Bandung",
  event_duration: "8 hours",
  line_items: [
    {
      id: "line-1",
      description: "Pre-wedding Photo & Video",
      qty: 1,
      unitPrice: 10000000,
    },
  ],
  deliverables: [
    { id: "del-1", description: "30 Edited Photos" },
  ],
  notes: "",
  terms: "",
  subtotal: 10000000,
  parent_id: null,
  revision: 0,
  project_id: null,
  status: "draft",
  payment_terms: "split",
  created_at: "2026-11-20T00:00:00Z",
  updated_at: "2026-11-20T00:00:00Z",
};

describe("invoiceFromQuotation", () => {
  it("defaults to split payment with 50% deposit for standard quotations", () => {
    const invoice = invoiceFromQuotation(baseQuote);
    expect(invoice.invoiceNumber).toBe("MH-202611-0005-INV");
    expect(invoice.paymentMode).toBe("split");
    expect(invoice.depositPaid).toBe(5000000);
    expect(invoice.terms).toContain("remaining balance");
  });

  it("defaults to full payment with 0 deposit when quote payment_terms is 'full'", () => {
    const fullQuote: SavedQuotation = {
      ...baseQuote,
      payment_terms: "full",
    };
    const invoice = invoiceFromQuotation(fullQuote);
    expect(invoice.paymentMode).toBe("full");
    expect(invoice.depositPaid).toBe(0);
    expect(invoice.terms).toContain("full payment of services rendered");
  });
});
