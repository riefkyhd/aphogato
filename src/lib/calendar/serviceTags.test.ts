import { describe, expect, it } from "vitest";
import {
  DEFAULT_SERVICES,
  nextPaymentStatus,
  normalizePaymentStatus,
  normalizeServices,
} from "./serviceTags";

describe("serviceTags", () => {
  it("normalizes empty or invalid services to default ['photography']", () => {
    expect(normalizeServices(null)).toEqual(DEFAULT_SERVICES);
    expect(normalizeServices(undefined)).toEqual(DEFAULT_SERVICES);
    expect(normalizeServices([])).toEqual(DEFAULT_SERVICES);
    expect(normalizeServices("")).toEqual(DEFAULT_SERVICES);
  });

  it("normalizes and cleans service string arrays", () => {
    expect(normalizeServices(["Photography", " VIDEOGRAPHY "])).toEqual([
      "photography",
      "videography",
    ]);
  });

  it("handles string input and deduplicates", () => {
    expect(normalizeServices("videography")).toEqual(["videography"]);
    expect(normalizeServices(["photography", "photography"])).toEqual([
      "photography",
    ]);
  });

  it("normalizes payment status accurately", () => {
    expect(normalizePaymentStatus("unpaid")).toBe("unpaid");
    expect(normalizePaymentStatus("deposit_paid")).toBe("deposit_paid");
    expect(normalizePaymentStatus("paid_in_full")).toBe("paid_in_full");
    expect(normalizePaymentStatus("unknown")).toBe("unpaid");
    expect(normalizePaymentStatus(null)).toBe("unpaid");
  });

  it("cycles payment status forward correctly", () => {
    expect(nextPaymentStatus("unpaid")).toBe("deposit_paid");
    expect(nextPaymentStatus("deposit_paid")).toBe("paid_in_full");
    expect(nextPaymentStatus("paid_in_full")).toBe("unpaid");
  });
});
