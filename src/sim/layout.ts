import type { Vec2 } from "./types";

/** Design coordinates from docs/LEVEL_LAYOUT_V1.md, in meters. */
export const LANDMARKS = {
  arrival: { x: 0, z: 0 },
  fork: { x: 25, z: 45 },
  bridge: { x: 75, z: 70 },
  slope: { x: 30, z: 110 },
  hut: { x: 110.5, z: 145 },
  shed: { x: 140.6, z: 155 },
  hide: { x: 105, z: 157 },
  passage: { x: 175, z: 205 },
} as const;

export const WORLD = { minX: -36, maxX: 210, minZ: -30, maxZ: 236 };

export const HUT = {
  minX: 106,
  maxX: 115,
  minZ: 141,
  maxZ: 149,
  wall: 0.32,
  height: 2.85,
};

export const SHED = {
  minX: 138.4,
  maxX: 143.4,
  minZ: 153.2,
  maxZ: 157.4,
  height: 2.45,
};

export const HIDE = { minX: 103.2, maxX: 110.4, minZ: 149.1, maxZ: 158.4 };

export const BRIDGE = {
  ax: 58,
  az: 62,
  bx: 93,
  bz: 83,
  halfWidth: 1.7,
};

export const BRIDGE_ROUTE: Vec2[] = [
  { x: 2.2, z: 6 },
  { x: 25, z: 45 },
  { x: 58, z: 62 },
  { x: 93, z: 83 },
  { x: 110, z: 139 },
];

export const SLOPE_ROUTE: Vec2[] = [
  { x: 2.2, z: 6 },
  { x: 25, z: 45 },
  { x: 16, z: 78 },
  { x: 28, z: 108 },
  { x: 62, z: 128 },
  { x: 106, z: 139 },
];

export const ESCAPE_ROUTE: Vec2[] = [
  { x: 140, z: 155 },
  { x: 158, z: 178 },
  { x: 175, z: 205 },
];

export const PATROL: Vec2[] = [
  { x: 64, z: 186 },
  { x: 118, z: 198 },
  { x: 168, z: 176 },
  { x: 142, z: 188 },
];

export const MONSTER_HOME = { x: 78, z: 190 };

export const CHECKPOINTS = {
  1: { x: 2.4, z: 6.5, yaw: 0.08 },
  2: { x: 109.3, z: 144.8, yaw: 0.15 },
  3: { x: 134.5, z: 151.5, yaw: 0.55 },
} as const;

export const INTERACT = {
  carRadio: { x: 0.2, z: 1.2, radius: 2.6 },
  sign: { x: 23.2, z: 43.4, radius: 2.3 },
  bridgeSign: { x: 29.4, z: 46.6, radius: 2.2 },
  slopeSign: { x: 21.2, z: 49.2, radius: 2.2 },
  notebook: { x: 112.7, z: 143.7, radius: 1.6 },
  panel: { x: 107.15, z: 147.55, radius: 1.65 },
  radio: { x: 113.15, z: 144.05, radius: 1.7 },
  frontDoor: { x: 110.0, z: 141.15, radius: 1.8 },
  sideDoor: { x: 114.85, z: 145.2, radius: 1.7 },
  shedDoor: { x: 138.35, z: 155.2, radius: 1.8 },
  antenna: { x: 141.7, z: 158.6, radius: 2.15 },
  passage: { x: 175, z: 205, radius: 3.4 },
} as const;

export const PALETTE = {
  shadow: "#0B1014",
  pine: "#1D2B26",
  pineDeep: "#14211c",
  moss: "#24352c",
  fog: "#87958F",
  fogNight: "#1A2420",
  wood: "#5A4838",
  woodDark: "#3A2E24",
  warm: "#C89A62",
  signal: "#8C2F2F",
  moon: "#9AADC0",
  dirt: "#3A342C",
  path: "#4A4036",
  water: "#1A2428",
} as const;
