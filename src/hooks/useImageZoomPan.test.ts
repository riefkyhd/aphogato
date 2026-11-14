import { describe, it, expect } from "vitest";
import {
  clampZoom,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  QUICK_ZOOM_SCALE,
} from "@/hooks/useImageZoomPan";

describe("useImageZoomPan constants & clamping", () => {
  it("exports expected standard zoom parameters", () => {
    expect(MIN_ZOOM).toBe(0.5);
    expect(MAX_ZOOM).toBe(4.0);
    expect(ZOOM_STEP).toBe(0.5);
    expect(QUICK_ZOOM_SCALE).toBe(2.0);
  });

  it("clamps zoom within default min and max boundaries", () => {
    expect(clampZoom(0.2)).toBe(0.5);
    expect(clampZoom(0.5)).toBe(0.5);
    expect(clampZoom(1.0)).toBe(1.0);
    expect(clampZoom(2.5)).toBe(2.5);
    expect(clampZoom(4.0)).toBe(4.0);
    expect(clampZoom(5.8)).toBe(4.0);
  });

  it("clamps zoom within custom min and max boundaries", () => {
    expect(clampZoom(0.8, 1.0, 3.0)).toBe(1.0);
    expect(clampZoom(3.5, 1.0, 3.0)).toBe(3.0);
    expect(clampZoom(2.0, 1.0, 3.0)).toBe(2.0);
  });

  it("rounds floating point values cleanly to 2 decimals", () => {
    expect(clampZoom(1.33333333)).toBe(1.33);
    expect(clampZoom(2.66666666)).toBe(2.67);
  });
});
