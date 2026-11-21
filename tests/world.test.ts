import { describe, expect, it } from "vitest";
import { BODY } from "../src/sim/balance";
import { BRIDGE_ROUTE, ESCAPE_ROUTE, HUT, MONSTER_HOME, SLOPE_ROUTE } from "../src/sim/layout";
import { distanceToPolyline } from "../src/sim/rng";
import { findPath, pathInside } from "../src/sim/nav";
import { polylineLength } from "../src/sim/rng";
import { resolveMove } from "../src/sim/movement";
import { bridgeQuery, createWorld, indoors, slopeFactor, surfaceAt } from "../src/sim/world";

const world = createWorld(170147);

function segmentInside(
  points: readonly { x: number; z: number }[],
  box: { minX: number; maxX: number; minZ: number; maxZ: number },
): boolean {
  const hit = (x: number, z: number) => x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    for (let s = 0; s <= 12; s += 1) {
      const t = s / 12;
      if (hit(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return true;
    }
  }
  return pathInside(points, box);
}

describe("forest layout", () => {
  it("makes the slope route longer and steeper than the bridge", () => {
    expect(polylineLength(SLOPE_ROUTE)).toBeGreaterThan(polylineLength(BRIDGE_ROUTE) + 12);
    expect(slopeFactor(33, 102)).toBeLessThan(0.8);
    expect(slopeFactor(110.5, 145)).toBeGreaterThan(0.95);
    expect(world.trees.length).toBeGreaterThan(400);
  });

  it("marks the bridge as loud wood and the hut as an interior floor", () => {
    expect(bridgeQuery(75, 72)).not.toBeNull();
    expect(surfaceAt(75, 72)).toBe("wood");
    expect(surfaceAt(110.5, 145)).toBe("floor");
    expect(indoors(110.5, 145)).toBe(true);
  });

  it("routes around the closed hut and through an open door", () => {
    const doorsClosed = (x: number, z: number) =>
      (x > 109.5 && x < 112.5 && z > 140 && z < 142.4) || (x > 114.2 && x < 116 && z > 143.5 && z < 146.5);
    const around = findPath(world.grid, { x: 100, z: 145 }, { x: 122, z: 145 }, doorsClosed);
    expect(around).not.toBeNull();
    expect(
      pathInside(around ?? [], { minX: HUT.minX + 0.8, maxX: HUT.maxX - 0.8, minZ: HUT.minZ + 0.8, maxZ: HUT.maxZ - 0.8 }),
    ).toBe(false);
    const through = findPath(world.grid, { x: 111, z: 136 }, { x: 111, z: 145 });
    expect(through, JSON.stringify(through?.slice(0, 15))).not.toBeNull();
    const doorway = { minX: 109.6, maxX: 112.4, minZ: 139.4, maxZ: 142.8 };
    expect(segmentInside(through ?? [], doorway), JSON.stringify(through)).toBe(true);
  });

  it("blocks a body on a closed door and lets it through once the door is open", () => {
    const doors = { front: false, side: false, shed: false };
    let x = 111;
    let z = 138.6;
    for (let i = 0; i < 16; i += 1) {
      const next = resolveMove(x, z, 0, 0.25, BODY.radius, world.boxes, doors);
      x = next.x;
      z = next.z;
    }
    expect(z).toBeLessThan(140.6);
    x = 111;
    z = 138.6;
    for (let i = 0; i < 16; i += 1) {
      const next = resolveMove(x, z, 0, 0.25, BODY.radius, world.boxes, { ...doors, front: true });
      x = next.x;
      z = next.z;
    }
    expect(z).toBeGreaterThan(141.2);
  });

  it("keeps a path from the car to the hut", () => {
    const path = findPath(world.grid, { x: 2.4, z: 6.5 }, { x: 110, z: 136 });
    expect(path).not.toBeNull();
    expect(polylineLength(path ?? [])).toBeGreaterThan(80);
  });

  it("keeps both routes and the escape walkable", () => {
    const bridge = findPath(world.grid, BRIDGE_ROUTE[0] ?? { x: 2.2, z: 6 }, BRIDGE_ROUTE[BRIDGE_ROUTE.length - 1] ?? { x: 110, z: 139 });
    const slope = findPath(world.grid, SLOPE_ROUTE[0] ?? { x: 2.2, z: 6 }, SLOPE_ROUTE[SLOPE_ROUTE.length - 1] ?? { x: 106, z: 139 });
    const escape = findPath(world.grid, ESCAPE_ROUTE[0] ?? { x: 140, z: 155 }, ESCAPE_ROUTE[ESCAPE_ROUTE.length - 1] ?? { x: 175, z: 205 });
    expect(bridge).not.toBeNull();
    expect(slope).not.toBeNull();
    expect(escape).not.toBeNull();
  });

  it("fills the arrival view without putting trunks on the routes", () => {
    expect(world.trees.length).toBeGreaterThan(900);
    let nearest = Number.POSITIVE_INFINITY;
    for (const tree of world.trees) {
      nearest = Math.min(nearest, Math.hypot(tree.x - 2.2, tree.z - 8));
      const gap = Math.min(
        distanceToPolyline(tree.x, tree.z, BRIDGE_ROUTE),
        distanceToPolyline(tree.x, tree.z, SLOPE_ROUTE),
        distanceToPolyline(tree.x, tree.z, ESCAPE_ROUTE),
      );
      expect(gap).toBeGreaterThan(2.05);
    }
    expect(nearest).toBeGreaterThan(2);
    expect(nearest).toBeLessThan(14);
    let home = Number.POSITIVE_INFINITY;
    for (const tree of world.trees) home = Math.min(home, Math.hypot(tree.x - MONSTER_HOME.x, tree.z - MONSTER_HOME.z));
    expect(home).toBeGreaterThan(4);
  });
});
