import { describe, it, expect } from "vitest";
import {
  calendarIsActive,
  financeIsActive,
  galleriesIsActive,
  homeIsActive,
  navIsActive,
  projectsIsActive,
  quotesIsActive,
  settingsIsActive,
} from "@/lib/nav";

describe("nav active-route helpers", () => {
  it("homeIsActive only matches exactly /dashboard", () => {
    expect(homeIsActive("/dashboard")).toBe(true);
    expect(homeIsActive("/dashboard/finance")).toBe(false);
  });

  it("projectsIsActive matches dashboard, galleries, board, and project detail UUIDs", () => {
    expect(projectsIsActive("/dashboard")).toBe(true);
    expect(projectsIsActive("/dashboard/galleries")).toBe(true);
    expect(projectsIsActive("/dashboard/board")).toBe(true);
    expect(
      projectsIsActive("/dashboard/12345678-1234-1234-1234-1234567890ab")
    ).toBe(true);
    expect(projectsIsActive("/dashboard/finance")).toBe(false);
  });

  it("calendarIsActive matches calendar and clients routes", () => {
    expect(calendarIsActive("/dashboard/calendar")).toBe(true);
    expect(calendarIsActive("/dashboard/calendar/events")).toBe(true);
    expect(calendarIsActive("/dashboard/clients")).toBe(true);
    expect(calendarIsActive("/dashboard/clients/123")).toBe(true);
    expect(calendarIsActive("/dashboard/finance")).toBe(false);
  });

  it("financeIsActive matches finance, quotations, invoices, and pricing", () => {
    expect(financeIsActive("/dashboard/finance")).toBe(true);
    expect(financeIsActive("/dashboard/finance/breakdown")).toBe(true);
    expect(financeIsActive("/dashboard/quotations")).toBe(true);
    expect(financeIsActive("/dashboard/invoices")).toBe(true);
    expect(financeIsActive("/dashboard/pricing")).toBe(true);
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

  it("settingsIsActive matches settings routes", () => {
    expect(settingsIsActive("/dashboard/settings")).toBe(true);
    expect(settingsIsActive("/dashboard/settings/domain-verification")).toBe(true);
    expect(settingsIsActive("/dashboard/finance")).toBe(false);
  });

  it("navIsActive delegates to consolidated workspace helpers", () => {
    expect(navIsActive("/dashboard", "/dashboard")).toBe(true);
    expect(navIsActive("/dashboard/galleries", "/dashboard")).toBe(true);
    expect(navIsActive("/dashboard/calendar", "/dashboard/calendar")).toBe(true);
    expect(navIsActive("/dashboard/clients", "/dashboard/calendar")).toBe(true);
    expect(navIsActive("/dashboard/finance", "/dashboard/finance")).toBe(true);
    expect(navIsActive("/dashboard/quotations", "/dashboard/finance")).toBe(true);
    expect(navIsActive("/dashboard/settings", "/dashboard/settings")).toBe(true);
    expect(navIsActive("/dashboard", "/dashboard/finance")).toBe(false);
  });
});
