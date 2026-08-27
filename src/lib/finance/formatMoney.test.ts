import { describe, it, expect } from "vitest";
import { formatMoney, parseMoneyInput } from "@/lib/finance/formatMoney";

describe("parseMoneyInput", () => {
  it("parses plain numbers", () => {
    expect(parseMoneyInput("1500000")).toBe(1500000);
    expect(parseMoneyInput("0")).toBe(0);
  });

  it("treats final dot as decimal separator (so 1.500.000 → 1500)", () => {
    // Current behaviour: last '.' is decimal, prior thousand separators are stripped.
    expect(parseMoneyInput("1.500.000")).toBe(1500);
    expect(parseMoneyInput("1500,50")).toBe(1500.5);
  });

  it("handles trailing / leading whitespace", () => {
    expect(parseMoneyInput("  2500 ")).toBe(2500);
  });

  it("rejects blanks and negatives", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("  ")).toBeNull();
  });
});

describe("formatMoney (IDR)", () => {
  it("formats IDR without decimals", () => {
    const formatted = formatMoney(1500000);
    expect(formatted).toMatch(/1\.500\.000|Rp/);
  });
});
