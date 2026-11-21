import { describe, expect, it } from "vitest";
import { initialMission, powerMutex, reduceMission } from "../src/sim/mission";

describe("mission M01", () => {
  it("walks the full signal chain and keeps power exclusive", () => {
    let mission = initialMission();
    expect(powerMutex(mission)).toBe(true);
    mission = reduceMission(mission, { type: "CHOOSE_ROUTE", route: "bridge" });
    mission = reduceMission(mission, { type: "REACH_LANDMARK" });
    expect(mission.state).toBe("APPROACH");
    mission = reduceMission(mission, { type: "ENTER_HUT" });
    expect(mission.state).toBe("INSPECT_POWER");
    expect(mission.checkpoint).toBe(2);
    mission = reduceMission(mission, { type: "INSPECT_PANEL" });
    expect(mission.state).toBe("DIVERT_POWER");
    mission = reduceMission(mission, { type: "DIVERT_TO_RADIO" });
    expect(mission.state).toBe("TUNE_SIGNAL");
    expect(mission.radio).toBe(true);
    expect(mission.lights).toBe(false);
    expect(powerMutex(mission)).toBe(true);
    mission = reduceMission(mission, { type: "TUNE_LOCKED" });
    expect(mission.beat).toBe("transmitting");
    mission = reduceMission(mission, { type: "BREAK_LINK" });
    expect(mission.state).toBe("REPAIR_LINK");
    mission = reduceMission(mission, { type: "REPAIR_ANTENNA" });
    expect(mission.state).toBe("ESCAPE");
    expect(mission.checkpoint).toBe(3);
    mission = reduceMission(mission, { type: "REACH_PASSAGE" });
    expect(mission.state).toBe("COMPLETE");
    expect(powerMutex(mission)).toBe(true);
  });

  it("lets the slope route reach the same hut state", () => {
    let mission = reduceMission(initialMission(), { type: "CHOOSE_ROUTE", route: "slope" });
    mission = reduceMission(mission, { type: "ENTER_HUT" });
    expect(mission.route).toBe("slope");
    expect(mission.state).toBe("INSPECT_POWER");
  });

  it("accepts an early panel inspection without a softlock", () => {
    let mission = reduceMission(initialMission(), { type: "INSPECT_PANEL" });
    expect(mission.state).toBe("DIVERT_POWER");
    mission = reduceMission(mission, { type: "DIVERT_TO_RADIO" });
    expect(mission.state).toBe("TUNE_SIGNAL");
    mission = reduceMission(mission, { type: "RESTORE_LIGHTS" });
    expect(mission.lights).toBe(true);
    expect(mission.radio).toBe(false);
    expect(mission.state).toBe("TUNE_SIGNAL");
    expect(reduceMission(mission, { type: "TUNE_LOCKED" }).beat).toBe("none");
  });

  it("does not complete the passage early or repair before the link breaks", () => {
    let mission = initialMission();
    mission = reduceMission(mission, { type: "REACH_PASSAGE" });
    expect(mission.state).toBe("ARRIVAL");
    mission = reduceMission(mission, { type: "REPAIR_ANTENNA" });
    expect(mission.antenna).toBe(false);
  });

  it("keeps the first route choice", () => {
    let mission = reduceMission(initialMission(), { type: "CHOOSE_ROUTE", route: "bridge" });
    mission = reduceMission(mission, { type: "CHOOSE_ROUTE", route: "slope" });
    expect(mission.route).toBe("bridge");
  });
});
