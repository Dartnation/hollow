export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 extends Vec2 {
  y: number;
}

export type MissionState =
  | "ARRIVAL"
  | "APPROACH"
  | "INSPECT_POWER"
  | "DIVERT_POWER"
  | "TUNE_SIGNAL"
  | "REPAIR_LINK"
  | "ESCAPE"
  | "COMPLETE";

export type RouteId = "none" | "bridge" | "slope";
export type Beat = "none" | "transmitting" | "broken";
export type DoorId = "front" | "side" | "shed";
export type Surface = "dirt" | "wood" | "porch" | "floor" | "water";
export type Gait = "crouch" | "walk" | "run";

export type StimulusType =
  | "footstep"
  | "wood_footstep"
  | "run"
  | "door"
  | "generator"
  | "radio"
  | "splash";

export interface Stimulus {
  type: StimulusType;
  position: Vec3;
  intensity: number;
  time: number;
  sourceId: string;
}

export interface Doors {
  front: boolean;
  side: boolean;
  shed: boolean;
}

export interface Aabb {
  id: string;
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  /** When set, the box only exists while that door is closed. */
  door?: DoorId;
  blocksMove: boolean;
  blocksSight: boolean;
}

export interface Tree {
  x: number;
  z: number;
  scale: number;
  rot: number;
  tilt: number;
  kind: 0 | 1 | 2 | 3;
  trunkRadius: number;
}

export interface Rock {
  x: number;
  z: number;
  scale: number;
  rot: number;
  height: number;
}

export type AiState =
  | "IDLE"
  | "PATROL"
  | "SUSPICIOUS"
  | "INVESTIGATE"
  | "SEARCH"
  | "CHASE"
  | "ATTACK"
  | "LOST_TARGET"
  | "RETURN";

export interface Sight {
  position: Vec3;
  distance: number;
}

export interface AudioCue {
  kind: "footstep" | "door" | "generator" | "radio";
  position: Vec3;
  intensity: number;
  surface?: Surface;
}

export interface Input {
  forward: number;
  strafe: number;
  run: boolean;
  crouchHold: boolean;
  crouchToggle: boolean;
  yawDelta: number;
  pitchDelta: number;
  flashlightToggle: boolean;
  interactPressed: boolean;
  interactHeld: boolean;
  tuneDelta: number;
  journalToggle: boolean;
  pauseToggle: boolean;
}

export const EMPTY_INPUT: Input = {
  forward: 0,
  strafe: 0,
  run: false,
  crouchHold: false,
  crouchToggle: false,
  yawDelta: 0,
  pitchDelta: 0,
  flashlightToggle: false,
  interactPressed: false,
  interactHeld: false,
  tuneDelta: 0,
  journalToggle: false,
  pauseToggle: false,
};
