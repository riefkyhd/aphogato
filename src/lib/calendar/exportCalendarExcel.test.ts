import { describe, expect, it } from "vitest";
import { formatServicesSummary } from "@/lib/calendar/serviceTags";

describe("formatServicesSummary", () => {
  it("formats single service", () => {
    expect(formatServicesSummary(["photography"])).toBe("Photo");
    expect(formatServicesSummary(["videography"])).toBe("Video");
  });

  it("formats both services with plus separator", () => {
    expect(formatServicesSummary(["photography", "videography"])).toBe(
      "Photo + Video"
    );
  });

  it("handles unknown or empty with fallback", () => {
    expect(formatServicesSummary([])).toBe("Photo");
    expect(formatServicesSummary(null)).toBe("Photo");
  });
});
