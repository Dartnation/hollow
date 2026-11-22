import { describe, expect, it } from "vitest";
import { GameSim } from "../src/sim/game";
import { INTERACT } from "../src/sim/layout";
import { EMPTY_INPUT } from "../src/sim/types";

function play(seed = 170147): GameSim {
  const sim = new GameSim(seed);
  sim.start();
  return sim;
}

describe("vertical slice", () => {
  it("completes M01 from either approach without dropping the mutex", () => {
    for (const route of ["bridge", "slope"] as const) {
      const sim = play();
      if (route === "bridge") sim.placePlayer(75, 72, 0);
      else sim.placePlayer(28, 108, 0.2);
      sim.step(0.2, { ...EMPTY_INPUT, forward: 1 });
      expect(sim.mission.route).toBe(route);
      sim.placePlayer(110, 144.5, 0);
      expect(sim.mission.state).toBe("INSPECT_POWER");
      expect(sim.mission.checkpoint).toBe(2);
      sim.placePlayer(108.4, 146.6, 0);
      sim.lookAt(INTERACT.panel.x, INTERACT.panel.z);
      expect(sim.interact()).toBe("panel");
      expect(sim.mission.state).toBe("DIVERT_POWER");
      expect(sim.interact()).toBe("panel");
      expect(sim.mission.lights).toBe(false);
      expect(sim.mission.radio).toBe(true);
      expect(sim.mission.state).toBe("TUNE_SIGNAL");
      sim.placePlayer(INTERACT.radio.x + 1.15, INTERACT.radio.z, Math.PI);
      sim.lookAt(INTERACT.radio.x, INTERACT.radio.z);
      sim.interact();
      expect(sim.tuning).toBe(true);
      sim.setFrequency(97.4);
      sim.step(1.3);
      expect(sim.mission.beat).toBe("transmitting");
      sim.step(3.6);
      expect(sim.mission.state).toBe("REPAIR_LINK");
      sim.placePlayer(INTERACT.antenna.x - 0.8, INTERACT.antenna.z - 0.6, 0);
      sim.lookAt(INTERACT.antenna.x, INTERACT.antenna.z);
      sim.hold(2.2);
      expect(sim.mission.state).toBe("ESCAPE");
      expect(sim.mission.checkpoint).toBe(3);
      expect(sim.mission.antenna).toBe(true);
      sim.placePlayer(175, 205, 0);
      expect(sim.mission.state).toBe("COMPLETE");
      expect(sim.mode).toBe("complete");
      expect(sim.mission.lights).not.toBe(sim.mission.radio);
    }
  });

  it("hears the bridge but does not see through the hut", () => {
    const sim = play();
    sim.placeMonster(78, 112);
    sim.brain.state = "PATROL";
    sim.brain.speed = 0;
    sim.brain.goal = null;
    sim.placePlayer(75, 72, 1);
    sim.step(1.2, { ...EMPTY_INPUT, forward: 1, run: true });
    expect(sim.brain.lastStimulus).not.toBeNull();
    expect(sim.brain.lastKnown).toBeNull();
    expect(["SUSPICIOUS", "INVESTIGATE", "SEARCH"]).toContain(sim.brain.state);

    sim.placePlayer(110.2, 145, 0);
    sim.mission.doors = { front: false, side: false, shed: false, hunt: false };
    sim.placeMonster(110, 132);
    sim.monster.yaw = Math.atan2(0, 145 - 132);
    sim.brain.yaw = sim.monster.yaw;
    sim.brain.state = "PATROL";
    sim.brain.lastKnown = null;
    sim.step(0.8);
    expect(sim.brain.lastKnown).toBeNull();
    expect(sim.brain.state).not.toBe("CHASE");
  });

  it("sees a player in the open, then searches the last place it saw them", () => {
    const sim = play();
    sim.placePlayer(25, 40, 0);
    sim.placeMonster(25, 52);
    const yaw = Math.atan2(25 - 25, 40 - 52);
    sim.monster.yaw = yaw;
    sim.brain.yaw = yaw;
    sim.brain.state = "PATROL";
    sim.step(0.45);
    expect(sim.brain.lastKnown).not.toBeNull();
    const seenState: string = sim.brain.state;
    expect(seenState === "CHASE" || seenState === "ATTACK").toBe(true);
    const seenZ = sim.brain.lastKnown?.z ?? 0;
    sim.placePlayer(110.2, 145, 0);
    sim.mission.doors = { front: false, side: false, shed: false, hunt: false };
    sim.step(1.5);
    expect(sim.brain.lastKnown?.z).toBeCloseTo(seenZ, 0);
    const lostState: string = sim.brain.state;
    expect(lostState === "CHASE" || lostState === "LOST_TARGET" || lostState === "SEARCH").toBe(true);
  });

  it("restores a checkpoint after a catch and round-trips a save", () => {
    const sim = play();
    sim.placePlayer(110, 145, 0);
    expect(sim.mission.checkpoint).toBe(2);
    const raw = sim.serialize();
    sim.placePlayer(25, 40, 0);
    sim.placeMonster(25, 41.4);
    sim.monster.yaw = Math.atan2(0, -1);
    sim.brain.yaw = sim.monster.yaw;
    sim.brain.state = "CHASE";
    sim.step(0.7);
    expect(sim.mode).toBe("dead");
    sim.step(2.4);
    expect(sim.mode).toBe("play");
    expect(sim.mission.state).toBe("INSPECT_POWER");
    expect(sim.mission.lights).toBe(true);
    expect(Math.hypot(sim.player.x - 109.3, sim.player.z - 144.8)).toBeLessThan(1);
    expect(Math.hypot(sim.monster.x - sim.player.x, sim.monster.z - sim.player.z)).toBeGreaterThan(20);

    const loaded = play();
    expect(loaded.load(raw)).toBe(true);
    expect(loaded.mission.state).toBe("INSPECT_POWER");
    expect(loaded.mission.checkpoint).toBe(2);
    expect(loaded.load('{"version":1,"lights":true,"radio":true}')).toBe(false);
  });
});
