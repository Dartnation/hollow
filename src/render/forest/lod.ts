/** Camera travel, in meters, before tree LOD buffers may be rebuilt. */
export const FOREST_REFRESH_DISTANCE = 12;

export type LodTier = "near" | "mid" | "far";

export function forestMoved(ax: number, az: number, bx: number, bz: number): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz >= FOREST_REFRESH_DISTANCE * FOREST_REFRESH_DISTANCE;
}

/**
 * Three distances with a band of hysteresis so a few metres of walking
 * does not swap a crown for a different silhouette.
 */
/** Trees past this distance are not instanced. Night fog has already hidden them. */
export const FOREST_DRAW_DISTANCE = 72;

export function lodTier(distance: number, previous: LodTier | null): LodTier {
  if (previous === "near") {
    if (distance < 16) return "near";
    return distance < 38 ? "mid" : "far";
  }
  if (previous === "mid") {
    if (distance < 11) return "near";
    if (distance > 44) return "far";
    return "mid";
  }
  if (previous === "far") {
    if (distance > 36) return "far";
    return distance < 12 ? "near" : "mid";
  }
  if (distance < 13) return "near";
  if (distance < 34) return "mid";
  return "far";
}
