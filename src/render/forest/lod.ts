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
export function lodTier(distance: number, previous: LodTier | null): LodTier {
  if (previous === "near") {
    if (distance < 26) return "near";
    return distance < 58 ? "mid" : "far";
  }
  if (previous === "mid") {
    if (distance < 16) return "near";
    if (distance > 64) return "far";
    return "mid";
  }
  if (previous === "far") {
    if (distance > 50) return "far";
    return distance < 18 ? "near" : "mid";
  }
  if (distance < 20) return "near";
  if (distance < 52) return "mid";
  return "far";
}
