import { describe, expect, it } from "vitest";
import { formatServicesSummary } from "@/lib/calendar/serviceTags";

describe("formatServicesSummary", () => {
  it("formats single service", () => {
    expect(formatServicesSummary(["photography"])).toBe("Photography");
    expect(formatServicesSummary(["videography"])).toBe("Videography");
  });

  it("formats both services with plus separator", () => {
    expect(formatServicesSummary(["photography", "videography"])).toBe(
      "Photography + Videography"
    );
  });

  it("handles unknown or empty with fallback", () => {
    expect(formatServicesSummary([])).toBe("Photography");
    expect(formatServicesSummary(null)).toBe("Photography");
  });
});
