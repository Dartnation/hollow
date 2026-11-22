import { describe, expect, it } from "vitest";
import { ESCAPE_ROUTE, HUNT } from "../src/sim/layout";
import { pointBlocked } from "../src/sim/movement";
import { createWorld } from "../src/sim/world";

describe("hunting cabin", () => {
  it("sits off the escape path on ground the forest left empty", () => {
    for (const seed of [170147, 22011]) {
      const world = createWorld(seed);
      const inside = world.trees.filter(
        (tree) => tree.x > HUNT.minX - 1.2 && tree.x < HUNT.maxX + 1.2 && tree.z > HUNT.minZ - 1.2 && tree.z < HUNT.maxZ + 1.2,
      );
      expect(inside).toEqual([]);
    }
    const world = createWorld(170147);
    expect(world.trees).toHaveLength(2400);
    const closed = { front: false, side: false, shed: false, hunt: false };
    expect(pointBlocked(157.34, 164, 0.3, world.boxes, closed)).toBe(true);
    const open = { ...closed, hunt: true };
    expect(pointBlocked(157.34, 164, 0.3, world.boxes, open)).toBe(false);
    expect(pointBlocked(160, 164, 0.34, world.boxes, open)).toBe(false);
    expect(pointBlocked(157.3, 162.5, 0.3, world.boxes, open)).toBe(true);
    const route = ESCAPE_ROUTE[0];
    expect(route).toBeDefined();
    const dx = 160 - (route?.x ?? 0);
    const dz = 164 - (route?.z ?? 0);
    expect(Math.hypot(dx, dz)).toBeGreaterThan(8);
  });
});