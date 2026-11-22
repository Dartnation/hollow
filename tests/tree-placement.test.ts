import { describe, expect, it } from "vitest";
import { createWorld } from "../src/sim/world";

function placement(seed: number): string {
  const world = createWorld(seed);
  let hash = world.trees.length;
  for (const tree of world.trees) {
    hash = Math.imul(hash ^ Math.round(tree.x * 100), 16777619);
    hash = Math.imul(hash ^ Math.round(tree.z * 100), 16777619);
    hash ^= tree.kind;
  }
  return `${world.trees.length}:${hash >>> 0}`;
}

describe("approved forest placement", () => {
  it("keeps every tree coordinate and kind for the review seeds", () => {
    expect(placement(170147)).toBe("2400:1396733313");
    expect(placement(22011)).toBe("2400:3560856733");
  });
});
