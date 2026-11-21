import type { Aabb, Vec3 } from "./types";

export function segmentHitsAabb(a: Vec3, b: Vec3, box: Aabb): boolean {
  const delta = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  let tmin = 0;
  let tmax = 1;
  const axes = ["x", "y", "z"] as const;
  for (const axis of axes) {
    const min = axis === "x" ? box.minX : axis === "y" ? box.minY : box.minZ;
    const max = axis === "x" ? box.maxX : axis === "y" ? box.maxY : box.maxZ;
    const origin = a[axis];
    const d = delta[axis];
    if (Math.abs(d) < 1e-8) {
      if (origin < min || origin > max) return false;
      continue;
    }
    let t1 = (min - origin) / d;
    let t2 = (max - origin) / d;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function lineOfSight(from: Vec3, to: Vec3, boxes: readonly Aabb[]): boolean {
  for (const box of boxes) {
    if (!box.blocksSight) continue;
    if (segmentHitsAabb(from, to, box)) return false;
  }
  return true;
}
