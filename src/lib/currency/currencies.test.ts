import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  getCurrencyInfo,
  SUPPORTED_CURRENCIES,
} from "./currencies";

describe("currencies registry", () => {
  it("includes IDR, SGD, USD, MYR, AUD, EUR, GBP, JPY", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("IDR");
    expect(codes).toContain("SGD");
    expect(codes).toContain("USD");
    expect(codes).toContain("MYR");
    expect(codes).toContain("AUD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("JPY");
  });

  it("handles decimal rules correctly", () => {
    expect(getCurrencyInfo("IDR").decimals).toBe(0);
    expect(getCurrencyInfo("JPY").decimals).toBe(0);
    expect(getCurrencyInfo("SGD").decimals).toBe(2);
    expect(getCurrencyInfo("USD").decimals).toBe(2);
  });

  it("formats currencies according to their locale and decimal rules", () => {
    const idr = formatCurrency(15000000, "IDR");
    expect(idr).toMatch(/Rp|15\.000\.000/);

    const sgd = formatCurrency(1500, "SGD");
    expect(sgd).toMatch(/1,500\.00|\$1,500\.00/);

    const usd = formatCurrency(1250.5, "USD");
    expect(usd).toMatch(/1,250\.50|\$1,250\.50/);

    const jpy = formatCurrency(50000, "JPY");
    expect(jpy).toMatch(/50,000|¥/);
  });

  it("falls back to uppercase code for unknown currencies", () => {
    const info = getCurrencyInfo("xyz");
    expect(info.code).toBe("XYZ");
    expect(info.decimals).toBe(2);
  });
});
