import { describe, expect, it } from "vitest";
import { WORLD } from "../src/sim/layout";
import { backgroundPlaneY, lowestTerrain, SKIRT_CLEARANCE } from "../src/sim/terrainBounds";
import { terrainHeight } from "../src/sim/world";

describe("forest skirt", () => {
  it("proves the old plane at -0.05 cuts through the stream bed", () => {
    expect(terrainHeight(76, 70)).toBeLessThan(-0.05);
    expect(lowestTerrain()).toBeLessThan(-0.05);
  });

  it("keeps the background plane under every terrain sample", () => {
    const min = lowestTerrain();
    const plane = backgroundPlaneY(min);
    expect(plane).toBeLessThan(min - SKIRT_CLEARANCE + 0.001);
    for (let x = WORLD.minX; x <= WORLD.maxX; x += 8) {
      for (let z = WORLD.minZ; z <= WORLD.maxZ; z += 8) {
        expect(terrainHeight(x, z)).toBeGreaterThan(plane);
      }
    }
  });
});
