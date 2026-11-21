import { Matrix, Mesh, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { BRIDGE_ROUTE, ESCAPE_ROUTE, HUT, SHED, SLOPE_ROUTE, WORLD } from "../../sim/layout";
import { distanceToPolyline, mulberry32 } from "../../sim/rng";
import { groundHeight, onSlope, streamDistance } from "../../sim/world";
import { pbr } from "../materials";
import { MeshAccum } from "./mesh";
interface Scatter {
  x: number;
  z: number;
  rot: number;
  scale: number;
}

function clearOfRoutes(x: number, z: number, gap: number): boolean {
  const path = Math.min(
    distanceToPolyline(x, z, BRIDGE_ROUTE),
    distanceToPolyline(x, z, SLOPE_ROUTE),
    distanceToPolyline(x, z, ESCAPE_ROUTE),
  );
  if (path < gap) return false;
  if (x > HUT.minX - 5 && x < HUT.maxX + 6 && z > HUT.minZ - 7 && z < HUT.maxZ + 8) return false;
  if (x > SHED.minX - 4 && x < SHED.maxX + 5 && z > SHED.minZ - 4 && z < SHED.maxZ + 5) return false;
  if (Math.hypot(x, z) < 7) return false;
  return true;
}

function scatter(seed: number, count: number, gap: number, bias: (x: number, z: number, rng: () => number) => boolean): Scatter[] {
  const rng = mulberry32(seed);
  const out: Scatter[] = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 14) {
    attempts += 1;
    const x = WORLD.minX + 6 + rng() * (WORLD.maxX - WORLD.minX - 12);
    const z = WORLD.minZ + 6 + rng() * (WORLD.maxZ - WORLD.minZ - 12);
    if (!clearOfRoutes(x, z, gap)) continue;
    if (!bias(x, z, rng)) continue;
    out.push({ x, z, rot: rng() * Math.PI * 2, scale: 0.75 + rng() * 0.7 });
  }
  return out;
}

function fan(name: string, scene: Scene, fronds: number, length: number, width: number): Mesh {
  const accum = new MeshAccum();
  for (let i = 0; i < fronds; i += 1) {
    const ang = (i / fronds) * Math.PI * 2;
    const dir = new Vector3(Math.cos(ang), 0.55, Math.sin(ang)).normalize();
    accum.addTaper(new Vector3(0, 0.02, 0), dir.scale(length), width, width * 0.15, 3, 0);
  }
  return accum.bake(name, scene);
}

function bushMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  for (let i = 0; i < 6; i += 1) {
    const ang = (i / 6) * Math.PI * 2;
    const origin = new Vector3(Math.cos(ang) * 0.18, 0.05, Math.sin(ang) * 0.18);
    accum.addTaper(origin, origin.add(new Vector3(Math.cos(ang) * 0.15, 0.62, Math.sin(ang) * 0.15)), 0.34, 0.04, 5, 0.1);
  }
  return accum.bake("bush", scene);
}

function logMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  accum.addTaper(new Vector3(-1.5, 0.22, 0), new Vector3(1.6, 0.34, 0.08), 0.22, 0.16, 6, 0.08);
  accum.addTaper(new Vector3(0.2, 0.32, 0), new Vector3(0.55, 0.7, 0.35), 0.08, 0.02, 4, 0);
  return accum.bake("fallen-log", scene);
}

function mossMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  accum.addTaper(new Vector3(0, 0.01, 0), new Vector3(0, 0.07, 0), 0.55, 0.5, 6, 0.15);
  return accum.bake("moss", scene);
}

function grassMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  for (let i = 0; i < 5; i += 1) {
    const ang = (i / 5) * Math.PI * 2;
    const dir = new Vector3(Math.cos(ang), 0.42, Math.sin(ang)).normalize();
    accum.addTaper(new Vector3(0, 0.02, 0), dir.scale(0.34), 0.1, 0.02, 3, 0);
  }
  return accum.bake("grass", scene);
}

export function buildUndergrowth(scene: Scene): void {
  const fern = fan("fern", scene, 7, 0.78, 0.16);
  fern.material = pbr(scene, "fern", "#2a4634", 0.8, 0);
  const bush = bushMesh(scene);
  bush.material = pbr(scene, "bush", "#1e332a", 0.84, 0);
  const log = logMesh(scene);
  const logMat = pbr(scene, "log", "#4a3b2e", 0.9, 0);
  log.material = logMat;
  const moss = mossMesh(scene);
  moss.material = pbr(scene, "moss", "#3d5a3a", 0.95, 0);
  const grass = grassMesh(scene);
  const blade = pbr(scene, "grass", "#4d6a45", 0.78, 0);
  blade.backFaceCulling = false;
  grass.material = blade;

  const ferns = scatter(1701471, 640, 2.6, (x, z, rng) => streamDistance(x, z) < 16 || rng() > 0.35);
  const bushes = scatter(1701472, 380, 3.1, (x, z) => (onSlope(x, z) ? true : streamDistance(x, z) > 6));
  const logs = scatter(1701473, 42, 4.2, (x, z, rng) => onSlope(x, z) || rng() > 0.82);
  const mosses = scatter(1701474, 520, 1.6, () => true);
  const grasses = scatter(1701475, 1400, 1.15, (x, z) => streamDistance(x, z) > 3.2);

  thin(fern, ferns, 0);
  thin(bush, bushes, 0);
  thin(log, logs, 0);
  thin(moss, mosses, 0);
  thin(grass, grasses, 0);
}

function thin(mesh: Mesh, items: readonly Scatter[], yLift: number): void {
  if (!items.length) {
    mesh.setEnabled(false);
    return;
  }
  const first = items[0];
  if (!first) return;
  mesh.position.set(first.x, groundHeight(first.x, first.z) + yLift, first.z);
  mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(first.rot, 0, 0);
  mesh.scaling.setAll(first.scale);
  const rest = items.slice(1);
  if (!rest.length) {
    mesh.thinInstanceCount = 0;
    return;
  }
  const buffer = new Float32Array(rest.length * 16);
  const matrix = new Matrix();
  rest.forEach((item, index) => {
    Matrix.ComposeToRef(
      new Vector3(item.scale, item.scale, item.scale),
      Quaternion.RotationYawPitchRoll(item.rot, 0, 0),
      new Vector3(item.x, groundHeight(item.x, item.z) + yLift, item.z),
      matrix,
    );
    matrix.copyToArray(buffer, index * 16);
  });
  mesh.thinInstanceSetBuffer("matrix", buffer, 16, false);
}
