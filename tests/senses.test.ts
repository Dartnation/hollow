import { describe, expect, it } from "vitest";
import { MonsterBrain } from "../src/sim/ai";
import { HEARING } from "../src/sim/balance";
import { evaluateHearing, loudnessAt, maxHearRange } from "../src/sim/hearing";
import { PATROL } from "../src/sim/layout";
import { canSee, visionRange } from "../src/sim/vision";
import type { Stimulus } from "../src/sim/types";

function noise(partial: Partial<Stimulus> & Pick<Stimulus, "position" | "intensity">): Stimulus {
  return {
    type: "wood_footstep",
    time: 1,
    sourceId: "player",
    ...partial,
  };
}

describe("hearing", () => {
  it("hears the bridge far away and ignores a quiet crouch", () => {
    const listener = { x: 0, y: 0, z: 0 };
    const wood = evaluateHearing(noise({ position: { x: 70, y: 0, z: 0 }, intensity: 0.95, type: "wood_footstep" }), listener);
    expect(wood.heard).toBe(true);
    expect(wood.perceivedPosition).toEqual({ x: 70, y: 0, z: 0 });
    const crouch = evaluateHearing(noise({ position: { x: 40, y: 0, z: 0 }, intensity: 0.07, type: "footstep" }), listener);
    expect(crouch.heard).toBe(false);
    expect(crouch.perceivedPosition).toBeNull();
  });

  it("does not report a position for a sound under the threshold", () => {
    const range = maxHearRange(0.07, 1 - HEARING.rain * HEARING.rainMask);
    expect(range).toBeLessThan(25);
    expect(loudnessAt(0.95, 70, 0.9)).toBeGreaterThan(HEARING.threshold);
  });
});

describe("vision", () => {
  const base = {
    hasLineOfSight: true,
    angleDeg: 0,
    distance: 10,
    crouching: false,
    speed: 0,
    flashlightOn: false,
    hiding: false,
    inSecurityLight: false,
  };

  it("never sees through a wall", () => {
    expect(canSee({ ...base, hasLineOfSight: false })).toBe(false);
  });

  it("shrinks range when the player hides and grows it in the light", () => {
    const hidden = visionRange({ ...base, crouching: true, hiding: true, speed: 0 });
    const lit = visionRange({ ...base, flashlightOn: true, inSecurityLight: true });
    expect(hidden).toBeLessThan(8);
    expect(lit).toBeGreaterThan(visionRange(base));
    expect(canSee({ ...base, crouching: true, hiding: true, speed: 0, distance: 10 })).toBe(false);
    expect(canSee({ ...base, crouching: true, hiding: true, speed: 0, distance: 4 })).toBe(true);
  });
});

describe("warden brain", () => {
  it("investigates a sound without learning the player's body", () => {
    const brain = new MonsterBrain(PATROL);
    brain.update(0.2, 1, { x: 0, z: 0 }, null, { position: { x: 20, y: 0, z: 4 }, loudness: 0.2 });
    expect(brain.state).toBe("SUSPICIOUS");
    expect(brain.lastKnown).toBeNull();
    expect(brain.lastStimulus).toEqual({ x: 20, y: 0, z: 4 });
    brain.update(2, 3, { x: 0, z: 0 }, null, null);
    expect(brain.state).toBe("INVESTIGATE");
    expect(brain.goal).toEqual({ x: 20, z: 4 });
    expect(brain.lastKnown).toBeNull();
  });

  it("chases only while seen, then searches the last known point", () => {
    const brain = new MonsterBrain(PATROL);
    const seen = { position: { x: 8, y: 1, z: 2 }, distance: 6 };
    brain.update(0.1, 1, { x: 0, z: 0 }, seen, null);
    expect(brain.state).toBe("CHASE");
    expect(brain.lastKnown?.x).toBe(8);
    brain.update(0.2, 1.2, { x: 1, z: 0 }, null, null);
    expect(brain.state).toBe("CHASE");
    expect(brain.goal).toEqual({ x: 8, z: 2 });
    brain.update(2, 4, { x: 3, z: 1 }, null, null);
    expect(brain.state === "LOST_TARGET" || brain.state === "SEARCH").toBe(true);
    expect(brain.lastKnown?.x).toBe(8);
    expect(brain.goal?.x).not.toBe(30);
  });

  it("catches only inside attack range and can lose the lunge", () => {
    const brain = new MonsterBrain(PATROL);
    const close = brain.update(0.1, 1, { x: 0, z: 0 }, { position: { x: 1, y: 1, z: 0 }, distance: 1.2 }, null);
    expect(close.caught).toBe(false);
    expect(brain.state).toBe("ATTACK");
    const finished = brain.update(0.6, 1.6, { x: 0, z: 0 }, { position: { x: 1, y: 1, z: 0 }, distance: 1.2 }, null);
    expect(finished.caught).toBe(true);
    const fleeing = new MonsterBrain(PATROL);
    fleeing.update(0.1, 1, { x: 0, z: 0 }, { position: { x: 1, y: 1, z: 0 }, distance: 1.2 }, null);
    const lost = fleeing.update(0.2, 1.2, { x: 0, z: 0 }, null, null);
    expect(lost.caught).toBe(false);
    expect(fleeing.state).not.toBe("ATTACK");
  });

  it("returns to patrol after the search expires", () => {
    const brain = new MonsterBrain(PATROL);
    brain.update(0.05, 1, { x: 0, z: 0 }, null, { position: { x: 2, y: 0, z: 0 }, loudness: 0.3 });
    brain.update(1, 2, { x: 0, z: 0 }, null, null);
    brain.update(0.2, 2.2, { x: 2, z: 0 }, null, null);
    expect(brain.state === "SEARCH" || brain.state === "RETURN" || brain.state === "PATROL").toBe(true);
    brain.update(12, 20, { x: 2, z: 0 }, null, null);
    expect(brain.state === "RETURN" || brain.state === "PATROL").toBe(true);
  });
});
