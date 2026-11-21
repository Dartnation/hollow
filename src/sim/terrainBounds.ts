import { WORLD } from "./layout";
import { terrainHeight } from "./world";

/** Metres the background plane must stay under the lowest terrain sample. */
export const SKIRT_CLEARANCE = 2.5;

/** Lowest gameplay terrain on a regular grid. The stream bed is the usual minimum. */
export function lowestTerrain(step = 2): number {
  let min = Number.POSITIVE_INFINITY;
  for (let x = WORLD.minX; x <= WORLD.maxX; x += step) {
    for (let z = WORLD.minZ; z <= WORLD.maxZ; z += step) {
      min = Math.min(min, terrainHeight(x, z));
    }
  }
  return min;
}

/** A flat far-background must sit under every terrain sample, never through a valley. */
export function backgroundPlaneY(minTerrain: number): number {
  return minTerrain - SKIRT_CLEARANCE;
}
