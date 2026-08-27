import { describe, it, expect } from "vitest";
import {
  QUOTATION_DEPOSIT_RATE,
  lineItemTotal,
  quotationDownPayment,
  quotationFinalBalance,
  quotationSubtotal,
} from "@/lib/quotations/calculations";

const item = (qty: number, unitPrice: number) => ({
  id: `${qty}-${unitPrice}`,
  description: "test",
  qty,
  unitPrice,
});

describe("quotation calculations", () => {
  it("lineItemTotal multiplies qty × unit price and clamps invalid values", () => {
    expect(lineItemTotal(item(2, 500))).toBe(1000);
    expect(lineItemTotal(item(-1, 500))).toBe(0);
    expect(lineItemTotal(item(2, -1))).toBe(0);
    expect(lineItemTotal(item(NaN, 500))).toBe(0);
  });

  it("quotationSubtotal sums line items", () => {
    expect(
      quotationSubtotal([item(1, 500), item(2, 250), item(0, 999)])
    ).toBe(1000);
  });

  it("quotationDownPayment is 50% by default rate", () => {
    expect(QUOTATION_DEPOSIT_RATE).toBe(0.5);
    expect(quotationDownPayment([item(1, 1000)])).toBe(500);
  });

  it("quotationFinalBalance uses explicit deposit when provided", () => {
    const items = [item(1, 1000)];
    expect(quotationFinalBalance(items)).toBe(500);
    expect(quotationFinalBalance(items, 700)).toBe(300);
    expect(quotationFinalBalance(items, 2000)).toBe(0);
  });
});
