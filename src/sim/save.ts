import type { Beat, Doors, MissionState, RouteId } from "./types";

export interface SaveData {
  version: 1;
  seed: number;
  mission: MissionState;
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
  mhz: number;
  tuning: boolean;
  flashlight: boolean;
  crouch: boolean;
  player: { x: number; z: number; yaw: number; pitch: number };
  snaps: Partial<Record<1 | 2 | 3, Snap>>;
}

export interface Snap {
  mission: MissionState;
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
  mhz: number;
  player: { x: number; z: number; yaw: number };
}

const STATES: readonly MissionState[] = [
  "ARRIVAL",
  "APPROACH",
  "INSPECT_POWER",
  "DIVERT_POWER",
  "TUNE_SIGNAL",
  "REPAIR_LINK",
  "ESCAPE",
  "COMPLETE",
];

export function serializeSave(data: SaveData): string {
  return JSON.stringify(data);
}

export function parseSave(raw: string): SaveData | null {
  try {
    const data = JSON.parse(raw) as SaveData;
    if (!data || data.version !== 1) return null;
    if (!STATES.includes(data.mission)) return null;
    if (!data.player || !data.doors || !data.snaps) return null;
    if (data.lights === data.radio) return null;
    return data;
  } catch {
    return null;
  }
}
