import { FOOTSTEP_INTENSITY } from "./balance";
import type { Aabb, Doors, Gait, Surface } from "./types";

export function footstepIntensity(surface: Surface, gait: Gait): number {
  return FOOTSTEP_INTENSITY[surface]?.[gait] ?? 0.2;
}

export function footstepType(surface: Surface, gait: Gait): "footstep" | "wood_footstep" | "run" | "splash" {
  if (surface === "water") return "splash";
  if (gait === "run" && surface !== "wood") return "run";
  if (surface === "wood" || surface === "porch") return "wood_footstep";
  return "footstep";
}

export function boxBlocks(box: Aabb, doors: Doors, kind: "move" | "sight"): boolean {
  if (kind === "move" && !box.blocksMove) return false;
  if (kind === "sight" && !box.blocksSight) return false;
  if (box.door && doors[box.door]) return false;
  return true;
}

export function pointBlocked(x: number, z: number, radius: number, boxes: readonly Aabb[], doors: Doors): boolean {
  for (const box of boxes) {
    if (!boxBlocks(box, doors, "move")) continue;
    if (x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius) return true;
  }
  return false;
}

export function resolveMove(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  boxes: readonly Aabb[],
  doors: Doors,
): { x: number; z: number } {
  let nx = x + dx;
  let nz = z + dz;
  if (pointBlocked(nx, z, radius, boxes, doors)) nx = x;
  if (pointBlocked(nx, nz, radius, boxes, doors)) nz = z;
  if (pointBlocked(nx, nz, radius, boxes, doors)) {
    nx = x;
    nz = z;
  }
  return { x: nx, z: nz };
}
