import { describe, it, expect } from "vitest";
import {
  financeIsActive,
  galleriesIsActive,
  homeIsActive,
  navIsActive,
  quotesIsActive,
} from "@/lib/nav";

describe("nav active-route helpers", () => {
  it("homeIsActive only matches exactly /dashboard", () => {
    expect(homeIsActive("/dashboard")).toBe(true);
    expect(homeIsActive("/dashboard/finance")).toBe(false);
  });

  it("financeIsActive matches finance routes", () => {
    expect(financeIsActive("/dashboard/finance")).toBe(true);
    expect(financeIsActive("/dashboard/finance/breakdown")).toBe(true);
    expect(financeIsActive("/dashboard/finances")).toBe(false);
  });

  it("quotesIsActive covers quotations, invoices, and pricing", () => {
    expect(quotesIsActive("/dashboard/quotations")).toBe(true);
    expect(quotesIsActive("/dashboard/invoices")).toBe(true);
    expect(quotesIsActive("/dashboard/pricing")).toBe(true);
    expect(quotesIsActive("/dashboard/pricing/abc")).toBe(true);
    expect(quotesIsActive("/dashboard/other")).toBe(false);
  });

  it("galleriesIsActive matches project detail UUIDs", () => {
    expect(
      galleriesIsActive("/dashboard/12345678-1234-1234-1234-1234567890ab")
    ).toBe(true);
    expect(galleriesIsActive("/dashboard/finance")).toBe(false);
    expect(galleriesIsActive("/dashboard/galleries")).toBe(true);
    expect(galleriesIsActive("/dashboard/board/x")).toBe(true);
  });

  it("navIsActive delegates to section helpers", () => {
    expect(navIsActive("/dashboard/finance", "/dashboard/finance")).toBe(true);
    expect(navIsActive("/dashboard/settings", "/dashboard/settings")).toBe(
      true
    );
    expect(navIsActive("/dashboard/settings/x", "/dashboard/settings")).toBe(
      true
    );
    expect(navIsActive("/dashboard", "/dashboard/finance")).toBe(false);
  });
});
