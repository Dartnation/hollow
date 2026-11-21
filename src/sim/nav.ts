import { WORLD } from "./layout";
import type { Aabb, Vec2 } from "./types";

export interface NavGrid {
  originX: number;
  originZ: number;
  cell: number;
  w: number;
  h: number;
  blocked: Uint8Array;
  cost: Float32Array;
}

const CELL = 2;

export function buildGrid(blockedBoxes: readonly Aabb[], slopeAt: (x: number, z: number) => number): NavGrid {
  const w = Math.ceil((WORLD.maxX - WORLD.minX) / CELL);
  const h = Math.ceil((WORLD.maxZ - WORLD.minZ) / CELL);
  const grid: NavGrid = {
    originX: WORLD.minX,
    originZ: WORLD.minZ,
    cell: CELL,
    w,
    h,
    blocked: new Uint8Array(w * h),
    cost: new Float32Array(w * h),
  };
  for (let cz = 0; cz < h; cz += 1) {
    for (let cx = 0; cx < w; cx += 1) {
      const p = cellCenter(grid, cx, cz);
      const border = p.x < WORLD.minX + 3 || p.x > WORLD.maxX - 3 || p.z < WORLD.minZ + 3 || p.z > WORLD.maxZ - 3;
      let blocked = border;
      if (!blocked) {
        const half = CELL / 2;
        for (const box of blockedBoxes) {
          if (!box.blocksMove || box.door) continue;
          const overlaps =
            p.x + half > box.minX &&
            p.x - half < box.maxX &&
            p.z + half > box.minZ &&
            p.z - half < box.maxZ;
          if (overlaps) {
            blocked = true;
            break;
          }
        }
      }
      const index = cz * w + cx;
      grid.blocked[index] = blocked ? 1 : 0;
      grid.cost[index] = 1 + Math.min(1.5, Math.max(0, slopeAt(p.x, p.z)) * 1.1);
    }
  }
  return grid;
}

export function stampDisc(grid: NavGrid, x: number, z: number, radius: number): void {
  const c = cellOf(grid, x, z);
  const r = Math.ceil((radius + grid.cell) / grid.cell);
  for (let dz = -r; dz <= r; dz += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      const cx = c.cx + dx;
      const cz = c.cz + dz;
      if (cx < 0 || cz < 0 || cx >= grid.w || cz >= grid.h) continue;
      const p = cellCenter(grid, cx, cz);
      if (Math.hypot(p.x - x, p.z - z) <= radius + grid.cell * 0.2) grid.blocked[cz * grid.w + cx] = 1;
    }
  }
}

export function cellCenter(grid: NavGrid, cx: number, cz: number): Vec2 {
  return { x: grid.originX + (cx + 0.5) * grid.cell, z: grid.originZ + (cz + 0.5) * grid.cell };
}

export function cellOf(grid: NavGrid, x: number, z: number): { cx: number; cz: number } {
  return {
    cx: Math.floor((x - grid.originX) / grid.cell),
    cz: Math.floor((z - grid.originZ) / grid.cell),
  };
}

function blockedCell(grid: NavGrid, cx: number, cz: number, extra?: (x: number, z: number) => boolean): boolean {
  if (cx < 0 || cz < 0 || cx >= grid.w || cz >= grid.h) return true;
  if (grid.blocked[cz * grid.w + cx]) return true;
  if (!extra) return false;
  const p = cellCenter(grid, cx, cz);
  return extra(p.x, p.z);
}

class Heap {
  private data: { f: number; cx: number; cz: number }[] = [];

  get length(): number {
    return this.data.length;
  }

  push(f: number, cx: number, cz: number): void {
    const a = this.data;
    a.push({ f, cx, cz });
    let n = a.length - 1;
    while (n > 0) {
      const p = (n - 1) >> 1;
      const parent = a[p];
      const child = a[n];
      if (!parent || !child || parent.f <= child.f) break;
      a[p] = child;
      a[n] = parent;
      n = p;
    }
  }

  pop(): { f: number; cx: number; cz: number } | undefined {
    const a = this.data;
    const top = a[0];
    const last = a.pop();
    if (!top) return undefined;
    if (a.length > 0 && last) {
      a[0] = last;
      let n = 0;
      while (true) {
        const l = n * 2 + 1;
        const r = l + 1;
        let m = n;
        if (l < a.length && a[l]!.f < a[m]!.f) m = l;
        if (r < a.length && a[r]!.f < a[m]!.f) m = r;
        if (m === n) break;
        const swap = a[n]!;
        a[n] = a[m]!;
        a[m] = swap;
        n = m;
      }
    }
    return top;
  }
}

export function findPath(grid: NavGrid, start: Vec2, goal: Vec2, extraBlocked?: (x: number, z: number) => boolean): Vec2[] | null {
  const s = nearestOpen(grid, cellOf(grid, start.x, start.z), extraBlocked);
  const g = nearestOpen(grid, cellOf(grid, goal.x, goal.z), extraBlocked);
  if (!s || !g) return null;
  if (s.cx === g.cx && s.cz === g.cz) return [goal];

  const total = grid.w * grid.h;
  const gScore = new Float32Array(total);
  gScore.fill(1e15);
  const parent = new Int32Array(total);
  parent.fill(-1);
  const closed = new Uint8Array(total);
  const key = (cx: number, cz: number) => cz * grid.w + cx;
  const startKey = key(s.cx, s.cz);
  gScore[startKey] = 0;
  const open = new Heap();
  open.push(heuristic(s.cx, s.cz, g.cx, g.cz), s.cx, s.cz);
  let expansions = 0;

  while (open.length) {
    const current = open.pop();
    if (!current) break;
    const ck = key(current.cx, current.cz);
    if (closed[ck]) continue;
    closed[ck] = 1;
    expansions += 1;
    if (expansions > total) return null;
    if (current.cx === g.cx && current.cz === g.cz) {
      const path: Vec2[] = [goal];
      let cursor = ck;
      let guard = 0;
      while (cursor !== startKey && cursor >= 0 && guard < total) {
        const cx = cursor % grid.w;
        const cz = Math.floor(cursor / grid.w);
        path.push(cellCenter(grid, cx, cz));
        cursor = parent[cursor] ?? -1;
        guard += 1;
      }
      path.reverse();
      return smooth(grid, path, extraBlocked);
    }
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dz === 0) continue;
        const nx = current.cx + dx;
        const nz = current.cz + dz;
        if (blockedCell(grid, nx, nz, extraBlocked)) continue;
        if (dx !== 0 && dz !== 0) {
          if (blockedCell(grid, current.cx + dx, current.cz, extraBlocked)) continue;
          if (blockedCell(grid, current.cx, current.cz + dz, extraBlocked)) continue;
        }
        const nk = key(nx, nz);
        if (closed[nk]) continue;
        const step = dx !== 0 && dz !== 0 ? 1.4142 : 1;
        const ng = (gScore[ck] ?? 1e15) + step * (grid.cost[nk] ?? 1);
        if (ng >= (gScore[nk] ?? 1e15)) continue;
        gScore[nk] = ng;
        parent[nk] = ck;
        open.push(ng + heuristic(nx, nz, g.cx, g.cz), nx, nz);
      }
    }
  }
  return null;
}

function heuristic(cx: number, cz: number, gx: number, gz: number): number {
  const dx = Math.abs(cx - gx);
  const dz = Math.abs(cz - gz);
  return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz);
}

function nearestOpen(
  grid: NavGrid,
  cell: { cx: number; cz: number },
  extra?: (x: number, z: number) => boolean,
): { cx: number; cz: number } | null {
  if (!blockedCell(grid, cell.cx, cell.cz, extra)) return cell;
  for (let r = 1; r <= 8; r += 1) {
    for (let dz = -r; dz <= r; dz += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!blockedCell(grid, cell.cx + dx, cell.cz + dz, extra)) return { cx: cell.cx + dx, cz: cell.cz + dz };
      }
    }
  }
  return null;
}

function segmentOpen(
  grid: NavGrid,
  a: Vec2,
  b: Vec2,
  extra?: (x: number, z: number) => boolean,
): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (grid.cell * 0.5)));
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const cell = cellOf(grid, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    if (blockedCell(grid, cell.cx, cell.cz, extra)) return false;
  }
  return true;
}

function smooth(grid: NavGrid, points: Vec2[], extra?: (x: number, z: number) => boolean): Vec2[] {
  if (points.length <= 2) return points;
  const out: Vec2[] = [];
  const first = points[0];
  if (!first) return points;
  out.push(first);
  let anchor = 0;
  for (let i = 2; i < points.length; i += 1) {
    const from = points[anchor];
    const to = points[i];
    if (!from || !to || !segmentOpen(grid, from, to, extra)) {
      const corner = points[i - 1];
      if (corner) out.push(corner);
      anchor = i - 1;
    }
  }
  const last = points[points.length - 1];
  if (last) out.push(last);
  return out;
}

export function pathInside(
  points: readonly Vec2[],
  box: { minX: number; maxX: number; minZ: number; maxZ: number },
): boolean {
  return points.some((p) => p.x > box.minX && p.x < box.maxX && p.z > box.minZ && p.z < box.maxZ);
}
