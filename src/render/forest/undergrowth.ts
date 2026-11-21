import { Matrix, Mesh, PBRMaterial, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { BRIDGE_ROUTE, ESCAPE_ROUTE, HUT, SHED, SLOPE_ROUTE, WORLD } from "../../sim/layout";
import { distanceToPolyline, mulberry32 } from "../../sim/rng";
import { groundHeight, onSlope, streamDistance } from "../../sim/world";
import { pbr } from "../materials";
import { MeshAccum } from "./mesh";
import { placeThin } from "./thin";
import { paintFern, paintNeedles, paintTuft } from "./textures";

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
  if (x > HUT.minX - 1.4 && x < HUT.maxX + 1.8 && z > HUT.minZ - 1.6 && z < HUT.maxZ + 2) return false;
  if (x > SHED.minX - 1.6 && x < SHED.maxX + 2 && z > SHED.minZ - 1.6 && z < SHED.maxZ + 2) return false;
  if (Math.hypot(x - 2.4, z - 6.5) < 3.2) return false;
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

function cutout(scene: Scene, name: string, hex: string): PBRMaterial {
  const material = pbr(scene, name, hex, 0.9, 0);
  material.useAlphaFromAlbedoTexture = true;
  material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
  material.alphaCutOff = 0.3;
  material.backFaceCulling = false;
  material.twoSidedLighting = true;
  return material;
}

function fernMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  const up = new Vector3(0.05, 0.82, 0.35).normalize();
  accum.addCard(new Vector3(0, 0.32, 0.12), Vector3.Right(), up, 0.62, 0.78);
  return accum.bake("fern", scene);
}

function bushMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  accum.addCard(new Vector3(0, 0.28, 0), Vector3.Right(), Vector3.Up(), 0.7, 0.55);
  accum.addCard(new Vector3(0, 0.26, 0), new Vector3(0.2, 0, 0.8), Vector3.Up(), 0.62, 0.5);
  accum.addCard(new Vector3(0.1, 0.22, 0.05), new Vector3(0.7, 0, -0.3), new Vector3(0.1, 0.7, 0.2), 0.5, 0.42);
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
  accum.addCard(new Vector3(0, 0.28, 0), Vector3.Right(), Vector3.Up(), 0.42, 0.58);
  accum.addCard(new Vector3(0, 0.26, 0), new Vector3(0.15, 0, 0.85), Vector3.Up(), 0.36, 0.52);
  return accum.bake("grass", scene);
}

function rootMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  for (let i = 0; i < 3; i += 1) {
    const ang = (i / 3) * Math.PI * 2;
    const dir = new Vector3(Math.cos(ang), 0.04, Math.sin(ang));
    accum.addTaper(new Vector3(0, 0.05, 0), dir.scale(0.85), 0.07, 0.02, 3, 0);
  }
  return accum.bake("root", scene);
}

function stickMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  accum.addTaper(new Vector3(-0.45, 0.06, 0), new Vector3(0.5, 0.1, 0.05), 0.035, 0.015, 3, 0);
  return accum.bake("stick", scene);
}

function saplingMesh(scene: Scene): Mesh {
  const accum = new MeshAccum();
  accum.addCard(new Vector3(0, 0.42, 0), Vector3.Right(), Vector3.Up(), 0.34, 0.7);
  accum.addCard(new Vector3(0, 0.4, 0), new Vector3(0.25, 0, 0.85), Vector3.Up(), 0.28, 0.62);
  return accum.bake("sapling", scene);
}

export function buildUndergrowth(scene: Scene): void {
  const needles = paintNeedles(scene);
  const fernTex = paintFern(scene);
  const tuft = paintTuft(scene);
  const fern = fernMesh(scene);
  const fernMat = cutout(scene, "fern", "#e4ebe4");
  fernMat.albedoTexture = fernTex;
  fern.material = fernMat;
  const bush = bushMesh(scene);
  const bushMat = cutout(scene, "bush", "#d5ddd4");
  bushMat.albedoTexture = needles;
  bush.material = bushMat;
  const log = logMesh(scene);
  log.material = pbr(scene, "log", "#4a3b2e", 0.94, 0);
  const moss = mossMesh(scene);
  moss.material = pbr(scene, "moss", "#3d5a3a", 0.95, 0);
  const grass = grassMesh(scene);
  const blade = cutout(scene, "grass", "#dfe6dc");
  blade.albedoTexture = tuft;
  grass.material = blade;

  const root = rootMesh(scene);
  root.material = pbr(scene, "root", "#4a3a2c", 0.94, 0);
  const stick = stickMesh(scene);
  stick.material = pbr(scene, "stick", "#5a4636", 0.9, 0);
  const sapling = saplingMesh(scene);
  const saplingMat = cutout(scene, "sapling", "#d5ddd4");
  saplingMat.albedoTexture = needles;
  sapling.material = saplingMat;

  const ferns = scatter(1701471, 1100, 0.85, (x, z, rng) => streamDistance(x, z) < 18 || rng() > 0.22);
  const bushes = scatter(1701472, 640, 1.45, (x, z) => onSlope(x, z) || streamDistance(x, z) > 5);
  const logs = scatter(1701473, 78, 2.55, (x, z, rng) => onSlope(x, z) || rng() > 0.78);
  const mosses = scatter(1701474, 860, 0.35, () => true);
  const grasses = scatter(1701475, 2400, 0.45, (x, z) => streamDistance(x, z) > 2.2);
  const roots = scatter(1701476, 420, 1.2, () => true);
  const sticks = scatter(1701477, 520, 1.05, () => true);
  const saplings = scatter(1701478, 460, 1.9, (x, z, rng) => onSlope(x, z) || rng() > 0.35);

  thin(fern, ferns, 0);
  thin(bush, bushes, 0);
  thin(log, logs, 0);
  thin(moss, mosses, 0);
  thin(grass, grasses, 0);
  thin(root, roots, 0);
  thin(stick, sticks, 0);
  thin(sapling, saplings, 0);
}

function thin(mesh: Mesh, items: readonly Scatter[], yLift: number): void {
  const matrices: Matrix[] = [];
  const matrix = new Matrix();
  for (const item of items) {
    Matrix.ComposeToRef(
      new Vector3(item.scale, item.scale, item.scale),
      Quaternion.RotationYawPitchRoll(item.rot, 0, 0),
      new Vector3(item.x, groundHeight(item.x, item.z) + yLift, item.z),
      matrix,
    );
    matrices.push(matrix.clone());
  }
  placeThin(mesh, matrices);
}
