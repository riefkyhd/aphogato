import { describe, expect, it } from "vitest";
import {
  draftToInsertPayload,
  normalizeQuotation,
  savedQuotationToDraft,
} from "./db";
import { createBlankQuotation } from "./defaults";

describe("quotations multi-currency support", () => {
  it("defaults to IDR with exchange_rate_to_idr 1 for standard quotations", () => {
    const draft = createBlankQuotation("Q-001");
    draft.lineItems = [
      { id: "1", description: "Studio Session", qty: 1, unitPrice: 5000000 },
    ];

    const payload = draftToInsertPayload(draft);
    expect(payload.currency).toBe("IDR");
    expect(payload.exchange_rate_to_idr).toBe(1);
    expect(payload.total_idr).toBe(5000000);
    expect(payload.subtotal).toBe(5000000);
  });

  it("calculates total_idr correctly for foreign currency using locked exchange rate", () => {
    const draft = createBlankQuotation("Q-002");
    draft.currency = "SGD";
    draft.exchangeRateToIdr = 14136.83;
    draft.exchangeRateDate = "2026-11-19T02:00:00Z";
    draft.lineItems = [
      { id: "1", description: "Destination Wedding", qty: 1, unitPrice: 1500 },
    ];

    const payload = draftToInsertPayload(draft);
    expect(payload.currency).toBe("SGD");
    expect(payload.exchange_rate_to_idr).toBe(14136.83);
    expect(payload.exchange_rate_date).toBe("2026-11-19T02:00:00Z");
    expect(payload.subtotal).toBe(1500);
    expect(payload.total_idr).toBe(Math.round(1500 * 14136.83)); // 21,205,245
  });

  it("normalizes quotation row with fallback for legacy IDR rows without currency columns", () => {
    const legacyRow = {
      id: "quote-old",
      quote_number: "Q-OLD",
      subtotal: 10000000,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const normalized = normalizeQuotation(legacyRow);
    expect(normalized.currency).toBe("IDR");
    expect(normalized.exchange_rate_to_idr).toBe(1);
    expect(normalized.total_idr).toBe(10000000);
  });

  it("converts saved quotation back to draft preserving currency and exchange rate", () => {
    const saved = normalizeQuotation({
      id: "quote-sgd",
      quote_number: "Q-SGD",
      currency: "SGD",
      exchange_rate_to_idr: 14000,
      exchange_rate_date: "2026-11-15T00:00:00Z",
      total_idr: 28000000,
      subtotal: 2000,
      created_at: "2026-11-15T00:00:00Z",
      updated_at: "2026-11-15T00:00:00Z",
    });

    const draft = savedQuotationToDraft(saved);
    expect(draft.currency).toBe("SGD");
    expect(draft.exchangeRateToIdr).toBe(14000);
    expect(draft.exchangeRateDate).toBe("2026-11-15T00:00:00Z");
  });
});
