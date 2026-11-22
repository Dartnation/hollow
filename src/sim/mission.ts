import type { Beat, DoorId, Doors, MissionState, RouteId } from "./types";

export interface Mission {
  state: MissionState;
  beat: Beat;
  route: RouteId;
  lights: boolean;
  radio: boolean;
  radioLocked: boolean;
  antenna: boolean;
  notebook: boolean;
  signRead: boolean;
  doors: Doors;
  checkpoint: 1 | 2 | 3;
}

export type MissionEvent =
  | { type: "REACH_LANDMARK" }
  | { type: "ENTER_HUT" }
  | { type: "INSPECT_PANEL" }
  | { type: "DIVERT_TO_RADIO" }
  | { type: "RESTORE_LIGHTS" }
  | { type: "TUNE_LOCKED" }
  | { type: "BREAK_LINK" }
  | { type: "REPAIR_ANTENNA" }
  | { type: "REACH_PASSAGE" }
  | { type: "CHOOSE_ROUTE"; route: "bridge" | "slope" }
  | { type: "SET_DOOR"; door: DoorId; open: boolean }
  | { type: "READ_NOTEBOOK" }
  | { type: "READ_SIGN" };

export function initialMission(): Mission {
  return {
    state: "ARRIVAL",
    beat: "none",
    route: "none",
    lights: true,
    radio: false,
    radioLocked: false,
    antenna: false,
    notebook: false,
    signRead: false,
    doors: { front: false, side: false, shed: false, hunt: false },
    checkpoint: 1,
  };
}

export function powerMutex(mission: Mission): boolean {
  return mission.lights !== mission.radio;
}

function power(mission: Mission, mode: "lights" | "radio"): Mission {
  return { ...mission, lights: mode === "lights", radio: mode === "radio" };
}

export function reduceMission(mission: Mission, event: MissionEvent): Mission {
  switch (event.type) {
    case "REACH_LANDMARK":
      return mission.state === "ARRIVAL" ? { ...mission, state: "APPROACH" } : mission;
    case "ENTER_HUT": {
      if (mission.state !== "ARRIVAL" && mission.state !== "APPROACH") return mission;
      return { ...mission, state: "INSPECT_POWER", checkpoint: mission.checkpoint < 2 ? 2 : mission.checkpoint };
    }
    case "INSPECT_PANEL": {
      if (mission.state === "ARRIVAL" || mission.state === "APPROACH" || mission.state === "INSPECT_POWER") {
        return {
          ...mission,
          state: "DIVERT_POWER",
          checkpoint: mission.checkpoint < 2 ? 2 : mission.checkpoint,
        };
      }
      return mission;
    }
    case "DIVERT_TO_RADIO": {
      const next = power(mission, "radio");
      if (next.state === "DIVERT_POWER" || next.state === "INSPECT_POWER" || next.state === "APPROACH") {
        return { ...next, state: "TUNE_SIGNAL", checkpoint: next.checkpoint < 2 ? 2 : next.checkpoint };
      }
      return next;
    }
    case "RESTORE_LIGHTS":
      return power(mission, "lights");
    case "TUNE_LOCKED":
      if (mission.state === "TUNE_SIGNAL" && mission.radio && !mission.lights) {
        return { ...mission, beat: "transmitting", radioLocked: true };
      }
      return mission;
    case "BREAK_LINK":
      if (mission.beat === "transmitting") return { ...mission, state: "REPAIR_LINK", beat: "broken" };
      return mission;
    case "REPAIR_ANTENNA":
      if (mission.state !== "REPAIR_LINK") return mission;
      return { ...mission, state: "ESCAPE", antenna: true, checkpoint: 3 };
    case "REACH_PASSAGE":
      return mission.state === "ESCAPE" ? { ...mission, state: "COMPLETE" } : mission;
    case "CHOOSE_ROUTE":
      return mission.route === "none" ? { ...mission, route: event.route } : mission;
    case "SET_DOOR":
      return { ...mission, doors: { ...mission.doors, [event.door]: event.open } };
    case "READ_NOTEBOOK":
      return { ...mission, notebook: true };
    case "READ_SIGN":
      return { ...mission, signRead: true };
    default:
      return mission;
  }
}
