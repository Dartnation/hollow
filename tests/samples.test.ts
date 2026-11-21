import { describe, expect, it } from "vitest";
import { sampleCounts } from "../src/render/forest/samples";

describe("showroom sample models", () => {
  it("builds volumetric spruce, pine and fern within a forest budget", () => {
    const counts = sampleCounts();
    expect(counts.spruce).toBeGreaterThan(800);
    expect(counts.spruce).toBeLessThan(8000);
    expect(counts.pine).toBeGreaterThan(400);
    expect(counts.pine).toBeLessThan(8000);
    expect(counts.fern).toBeGreaterThan(10);
    expect(counts.fern).toBeLessThan(200);
  });
});
