/** Camera travel, in meters, before tree LOD buffers may be rebuilt. */
export const FOREST_REFRESH_DISTANCE = 12;

/** Trees closer than this use the detailed mesh. The rest keep a cheap silhouette. */
export const FOREST_NEAR = 32;

export type LodTier = "near" | "far";

export function forestMoved(ax: number, az: number, bx: number, bz: number): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz >= FOREST_REFRESH_DISTANCE * FOREST_REFRESH_DISTANCE;
}

export function lodTier(distance: number): LodTier {
  return distance < FOREST_NEAR ? "near" : "far";
}
