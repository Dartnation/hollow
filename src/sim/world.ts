import { BODY } from "./balance";
import {
  BRIDGE,
  BRIDGE_ROUTE,
  ESCAPE_ROUTE,
  HIDE,
  HUT,
  INTERACT,
  LANDMARKS,
  MONSTER_HOME,
  PATROL,
  SHED,
  SLOPE_ROUTE,
  WORLD,
} from "./layout";
import { buildGrid, stampDisc, type NavGrid } from "./nav";
import { clamp, distance2, distanceToPolyline, mulberry32 } from "./rng";
import type { Aabb, Doors, Rock, Surface, Tree, Vec2 } from "./types";

const STREAM: Vec2[] = [
  { x: 40, z: 16 },
  { x: 58, z: 46 },
  { x: 76, z: 70 },
  { x: 96, z: 98 },
];

export interface World {
  seed: number;
  trees: Tree[];
  rocks: Rock[];
  boxes: Aabb[];
  grid: NavGrid;
}

export function streamDistance(x: number, z: number): number {
  return distanceToPolyline(x, z, STREAM);
}

function rawHeight(x: number, z: number): number {
  let h = Math.sin(x * 0.031 + 1.2) * Math.cos(z * 0.027) * 1.15;
  h += Math.sin(x * 0.082 + z * 0.047) * 0.32;
  const ridge = Math.exp(-((x - 26) ** 2) / 70 - ((z - 108) ** 2) / 260);
  h += ridge * 7.4;
  const stream = streamDistance(x, z);
  if (stream < 9) h -= (1 - stream / 9) ** 1.35 * 2.55;
  return h;
}

function blendPad(h: number, x: number, z: number, cx: number, cz: number, radius: number): number {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= radius) return h;
  const target = rawHeight(cx, cz);
  const t = d / radius;
  const s = t * t * (3 - 2 * t);
  return target * (1 - s) + h * s;
}

export function terrainHeight(x: number, z: number): number {
  let h = rawHeight(x, z);
  h = blendPad(h, x, z, 0, 4, 11);
  h = blendPad(h, x, z, LANDMARKS.fork.x, LANDMARKS.fork.z, 8);
  h = blendPad(h, x, z, LANDMARKS.hut.x, LANDMARKS.hut.z, 16);
  h = blendPad(h, x, z, LANDMARKS.shed.x, LANDMARKS.shed.z, 9);
  h = blendPad(h, x, z, LANDMARKS.passage.x, LANDMARKS.passage.z, 8);
  h = blendPad(h, x, z, BRIDGE.ax, BRIDGE.az, 5.5);
  h = blendPad(h, x, z, BRIDGE.bx, BRIDGE.bz, 5.5);
  return h;
}

export function bridgeQuery(x: number, z: number): { t: number; dist: number } | null {
  const abx = BRIDGE.bx - BRIDGE.ax;
  const abz = BRIDGE.bz - BRIDGE.az;
  const len2 = abx * abx + abz * abz;
  const t = clamp(((x - BRIDGE.ax) * abx + (z - BRIDGE.az) * abz) / len2, 0, 1);
  const px = BRIDGE.ax + abx * t;
  const pz = BRIDGE.az + abz * t;
  const dist = Math.hypot(x - px, z - pz);
  if (dist > BRIDGE.halfWidth || t <= 0.02 || t >= 0.98) return null;
  return { t, dist };
}

export function bridgeHeight(x: number, z: number): number | null {
  const q = bridgeQuery(x, z);
  if (!q) return null;
  const y0 = terrainHeight(BRIDGE.ax, BRIDGE.az);
  const y1 = terrainHeight(BRIDGE.bx, BRIDGE.bz);
  return y0 * (1 - q.t) + y1 * q.t + 0.42;
}

export function indoors(x: number, z: number): boolean {
  return x > HUT.minX + 0.4 && x < HUT.maxX - 0.4 && z > HUT.minZ + 0.4 && z < HUT.maxZ - 0.4;
}

export function inHide(x: number, z: number): boolean {
  return x > HIDE.minX && x < HIDE.maxX && z > HIDE.minZ && z < HIDE.maxZ;
}

export function inShed(x: number, z: number): boolean {
  return x > SHED.minX + 0.35 && x < SHED.maxX - 0.35 && z > SHED.minZ + 0.35 && z < SHED.maxZ - 0.35;
}

export function onSlope(x: number, z: number): boolean {
  if (bridgeQuery(x, z)) return false;
  return distanceToPolyline(x, z, SLOPE_ROUTE) < 7.5 && z > 68 && z < 136 && x < 96;
}

export function inSecurityZone(x: number, z: number): boolean {
  return distance2(x, z, LANDMARKS.hut.x, LANDMARKS.hut.z) < 16 && !indoors(x, z);
}

export function surfaceAt(x: number, z: number): Surface {
  if (indoors(x, z) || inShed(x, z)) return "floor";
  if (inHide(x, z) || (z > HUT.maxZ - 0.2 && z < HUT.maxZ + 3.2 && x > HUT.minX - 1 && x < HUT.maxX + 1)) {
    return "porch";
  }
  if (bridgeQuery(x, z)) return "wood";
  if (streamDistance(x, z) < 3.6) return "water";
  return "dirt";
}

export function groundHeight(x: number, z: number): number {
  const terrain = terrainHeight(x, z);
  const deck = bridgeHeight(x, z);
  let y = deck === null ? terrain : Math.max(terrain, deck);
  if (indoors(x, z) || inHide(x, z) || inShed(x, z)) {
    const pad = indoors(x, z) || inHide(x, z) ? terrainHeight(LANDMARKS.hut.x, LANDMARKS.hut.z) : terrainHeight(LANDMARKS.shed.x, LANDMARKS.shed.z);
    y = Math.max(y, pad + 0.04);
  }
  return y;
}

export function slopeFactor(x: number, z: number): number {
  if (bridgeQuery(x, z) || indoors(x, z)) return 1;
  const e = 0.55;
  const dx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const dz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const grad = Math.hypot(dx, dz) / (2 * e);
  if (grad < 0.22) return 1;
  return Math.max(0.55, 1 - (grad - 0.22) * 0.85);
}

export function waterDrag(surface: Surface): number {
  return surface === "water" ? 0.72 : 1;
}

function aabb(
  id: string,
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
  blocksMove: boolean,
  blocksSight: boolean,
  door?: Aabb["door"],
): Aabb {
  return { id, minX, minY, minZ, maxX, maxY, maxZ, blocksMove, blocksSight, ...(door ? { door } : {}) };
}

function hutBoxes(): Aabb[] {
  const y = 2.85;
  const s = 140.86;
  const n = 148.84;
  const w = 106;
  const e = 114.84;
  const boxes: Aabb[] = [];
  const south = (id: string, x0: number, x1: number, y0: number, y1: number, sight: boolean) => {
    boxes.push(aabb(id, x0, y0, s, x1, y1, s + 0.32, true, sight));
  };
  const west = (id: string, z0: number, z1: number, y0: number, y1: number, sight: boolean) => {
    boxes.push(aabb(id, w, y0, z0, w + 0.32, y1, z1, true, sight));
  };
  south("hut-s-l", 106, 110, 0, y, true);
  south("hut-s-r", 112, 115, 0, y, false);
  south("hut-s-r-low", 112, 115, 0, 1.12, true);
  south("hut-s-r-high", 112, 115, 2.18, y, true);
  south("hut-win-a", 112, 113.1, 1.12, 2.18, true);
  south("hut-win-c", 113.7, 115, 1.12, 2.18, true);
  boxes.push(aabb("door-front", 110, 0, s, 112, y, s + 0.8, true, true, "front"));

  boxes.push(aabb("hut-n", 106, 0, n, 115, y, n + 0.32, true, true));
  west("hut-w", 141, 149, 0, y, false);
  west("hut-w-low", 141, 149, 0, 1.12, true);
  west("hut-w-high", 141, 149, 2.18, y, true);
  west("hut-w-a", 141, 146.2, 1.12, 2.18, true);
  west("hut-w-b", 147.5, 149, 1.12, 2.18, true);

  boxes.push(aabb("hut-e-s", e, 0, 141, e + 0.32, y, 144, true, true));
  boxes.push(aabb("hut-e-n", e, 0, 146, e + 0.32, y, 149, true, true));
  boxes.push(aabb("door-side", e, 0, 144, e + 0.32, y, 146, true, true, "side"));

  boxes.push(aabb("table", 112.2, 0, 143.15, 114.35, 0.78, 144.85, true, false));
  boxes.push(aabb("bed", 106.55, 0, 146.15, 108.9, 0.7, 148.45, true, true));
  boxes.push(aabb("stove", 112.7, 0, 146.5, 114.45, 1.15, 148.35, true, true));
  return boxes;
}

function shedBoxes(): Aabb[] {
  const y = SHED.height;
  return [
    aabb("shed-n", SHED.minX, 0, SHED.maxZ - 0.28, SHED.maxX, y, SHED.maxZ, true, true),
    aabb("shed-s", SHED.minX, 0, SHED.minZ, SHED.maxX, y, SHED.minZ + 0.28, true, true),
    aabb("shed-e", SHED.maxX - 0.28, 0, SHED.minZ, SHED.maxX, y, SHED.maxZ, true, true),
    aabb("shed-w-s", SHED.minX, 0, SHED.minZ, SHED.minX + 0.28, y, 154, true, true),
    aabb("shed-w-n", SHED.minX, 0, 156, SHED.minX + 0.28, y, SHED.maxZ, true, true),
    aabb("door-shed", SHED.minX, 0, 154, SHED.minX + 0.28, y, 156, true, true, "shed"),
  ];
}

function propBoxes(): Aabb[] {
  return [
    aabb("car", -1.15, 0, -1.8, 1.25, 1.45, 2.15, true, true),
    aabb("crate-a", 104.35, 0, 153.15, 106.35, 1.5, 154.7, true, true),
    aabb("crate-b", 106.55, 0, 155.35, 108.45, 1.55, 157.05, true, true),
    aabb("log-cover", 34.2, 0, 116.4, 39.4, 1.15, 118.1, true, true),
    aabb("rock-cover", 20.4, 0, 96.2, 23.6, 1.45, 99.4, true, true),
  ];
}

function borderBoxes(): Aabb[] {
  const y = 6;
  return [
    aabb("border-w", WORLD.minX, 0, WORLD.minZ, WORLD.minX + 1.2, y, WORLD.maxZ, true, true),
    aabb("border-e", WORLD.maxX - 1.2, 0, WORLD.minZ, WORLD.maxX, y, WORLD.maxZ, true, true),
    aabb("border-s", WORLD.minX, 0, WORLD.minZ, WORLD.maxX, y, WORLD.minZ + 1.2, true, true),
    aabb("border-n", WORLD.minX, 0, WORLD.maxZ - 1.2, WORLD.maxX, y, WORLD.maxZ, true, true),
  ];
}

function clearance(x: number, z: number): boolean {
  if (distanceToPolyline(x, z, BRIDGE_ROUTE) < 6.3) return false;
  if (distanceToPolyline(x, z, SLOPE_ROUTE) < 5.5) return false;
  if (distanceToPolyline(x, z, ESCAPE_ROUTE) < 5.6) return false;
  if (distance2(x, z, 0, 4) < 9) return false;
  if (distance2(x, z, LANDMARKS.fork.x, LANDMARKS.fork.z) < 8) return false;
  if (distance2(x, z, LANDMARKS.passage.x, LANDMARKS.passage.z) < 8) return false;
  if (distance2(x, z, MONSTER_HOME.x, MONSTER_HOME.z) < 7) return false;
  for (const point of PATROL) {
    if (distance2(x, z, point.x, point.z) < 5) return false;
  }
  if (x > HUT.minX - 6 && x < HUT.maxX + 8 && z > HUT.minZ - 8 && z < HIDE.maxZ + 3) return false;
  if (x > SHED.minX - 5 && x < SHED.maxX + 6 && z > SHED.minZ - 5 && z < SHED.maxZ + 6) return false;
  if (bridgeQuery(x, z)) return false;
  return true;
}

function scatter(seed: number): { trees: Tree[]; rocks: Rock[] } {
  const rng = mulberry32(seed);
  const trees: Tree[] = [];
  let attempts = 0;
  while (trees.length < 680 && attempts < 9000) {
    attempts += 1;
    const x = WORLD.minX + 8 + rng() * (WORLD.maxX - WORLD.minX - 16);
    const z = WORLD.minZ + 8 + rng() * (WORLD.maxZ - WORLD.minZ - 16);
    if (!clearance(x, z)) continue;
    let crowded = false;
    for (let i = trees.length - 1; i >= 0; i -= 1) {
      const other = trees[i];
      if (!other) continue;
      if (Math.hypot(other.x - x, other.z - z) < 4.8) {
        crowded = true;
        break;
      }
    }
    if (crowded) continue;
    const roll = rng();
    const kind: Tree["kind"] = roll > 0.86 ? 3 : roll > 0.55 ? 1 : roll > 0.28 ? 2 : 0;
    const scale = 0.78 + rng() * 0.7;
    trees.push({
      x,
      z,
      scale,
      rot: rng() * Math.PI * 2,
      tilt: (rng() - 0.5) * 0.08,
      kind,
      trunkRadius: 0.22 * scale,
    });
  }

  const rocks: Rock[] = [];
  const anchors = [
    { x: 18, z: 92 },
    { x: 42, z: 122 },
    { x: 54, z: 104 },
    { x: 48, z: 78 },
    { x: 86, z: 96 },
    { x: 122, z: 176 },
    { x: 160, z: 168 },
    { x: 188, z: 196 },
  ];
  anchors.forEach((anchor, index) => {
    rocks.push({
      x: anchor.x,
      z: anchor.z,
      scale: 0.8 + (index % 3) * 0.35,
      rot: index * 0.7,
      height: 0.8 + (index % 4) * 0.22,
    });
  });
  let rockAttempts = 0;
  while (rocks.length < 28 && rockAttempts < 400) {
    rockAttempts += 1;
    const x = 10 + rng() * 190;
    const z = 60 + rng() * 150;
    if (distanceToPolyline(x, z, BRIDGE_ROUTE) < 4.2 && distanceToPolyline(x, z, SLOPE_ROUTE) < 3.4) continue;
    if (!clearance(x, z) && distanceToPolyline(x, z, SLOPE_ROUTE) > 9) continue;
    rocks.push({ x, z, scale: 0.55 + rng() * 0.9, rot: rng() * 6, height: 0.55 + rng() * 0.9 });
  }
  return { trees, rocks };
}

function treeBoxes(trees: readonly Tree[]): Aabb[] {
  const boxes: Aabb[] = [];
  for (const tree of trees) {
    if (tree.kind === 3 && tree.scale < 0.9) continue;
    const r = Math.max(0.24, tree.trunkRadius);
    boxes.push(aabb(`tree-${boxes.length}`, tree.x - r, 0, tree.z - r, tree.x + r, 2.4 * tree.scale, tree.z + r, true, true));
  }
  return boxes;
}

export function createWorld(seed: number): World {
  const { trees, rocks } = scatter(seed);
  const structural = [...hutBoxes(), ...shedBoxes(), ...propBoxes(), ...borderBoxes()];
  const grid = buildGrid(structural, (x, z) => 1 - slopeFactor(x, z));
  const boxes = [...structural, ...treeBoxes(trees)];
  for (const tree of trees) stampDisc(grid, tree.x, tree.z, tree.trunkRadius + BODY.monsterRadius + 0.25);
  for (const rock of rocks) {
    const r = 0.45 * rock.scale;
    boxes.push(aabb(`rock-${boxes.length}`, rock.x - r, 0, rock.z - r, rock.x + r, rock.height, rock.z + r, true, rock.height > 0.7));
    stampDisc(grid, rock.x, rock.z, r + BODY.monsterRadius);
  }
  return { seed, trees, rocks, boxes, grid };
}

export function nearFork(x: number, z: number): boolean {
  return distance2(x, z, LANDMARKS.fork.x, LANDMARKS.fork.z) < 8;
}

export function nearHut(x: number, z: number): boolean {
  return distance2(x, z, LANDMARKS.hut.x, LANDMARKS.hut.z) < 14 || indoors(x, z);
}

export function nearPassage(x: number, z: number): boolean {
  return distance2(x, z, INTERACT.passage.x, INTERACT.passage.z) < INTERACT.passage.radius;
}

export function playerChestY(crouching: boolean, ground: number): number {
  return ground + (crouching ? 0.78 : 1.28);
}

export function monsterEyeY(ground: number): number {
  return ground + BODY.monsterEye;
}
