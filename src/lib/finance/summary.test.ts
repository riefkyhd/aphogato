import { describe, it, expect } from "vitest";
import {
  buildFinanceSummary,
  filterEntriesByMonth,
} from "@/lib/finance/summary";

describe("buildFinanceSummary", () => {
  it("aggregates income and expenses per month and yields net totals", () => {
    const summary = buildFinanceSummary(
      2026,
      [
        { entry_date: "2026-01-15", amount: 500 },
        { entry_date: "2026-01-16", amount: "250" },
        { entry_date: "2025-12-31", amount: 999 },
      ] as never,
      [
        { entry_date: "2026-01-10", amount: 100 },
        { entry_date: "2026-03-01", amount: 200 },
      ] as never
    );

    expect(summary.year).toBe(2026);
    expect(summary.totalIncome).toBe(750);
    expect(summary.totalExpenses).toBe(300);
    expect(summary.net).toBe(450);
    expect(summary.months[0].income).toBe(750);
    expect(summary.months[0].expenses).toBe(100);
    expect(summary.months[0].net).toBe(650);
    expect(summary.months[2].expenses).toBe(200);
  });
});

describe("filterEntriesByMonth", () => {
  it("returns only rows whose date prefix matches YYYY-MM", () => {
    const rows = [
      { entry_date: "2026-01-15" },
      { entry_date: "2026-02-01" },
      { entry_date: "2025-01-15" },
    ];
    expect(filterEntriesByMonth(rows, 2026, 1)).toEqual([
      { entry_date: "2026-01-15" },
    ]);
    expect(filterEntriesByMonth(rows, 2026, 2)).toEqual([
      { entry_date: "2026-02-01" },
    ]);
  });
});
