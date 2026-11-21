import { type AbstractMesh, Mesh, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import type { Tree } from "../../sim/types";
import { MeshAccum } from "./mesh";
import { paintBark } from "./textures";
import { pbr } from "../materials";

export interface TreePrototype {
  bark: Mesh;
  foliage: Mesh | null;
}

type Family = "spruce" | "pine" | "snag";

function trunk(accum: MeshAccum, height: number, baseR: number, bend: number): void {
  const segments = 6;
  let prev = new Vector3(0, 0, 0);
  let prevR = baseR;
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const y = height * t;
    const r = baseR * (1 - t * 0.72);
    const p = new Vector3(Math.sin(t * 3.1) * bend, y, Math.cos(t * 2.4) * bend * 0.6);
    accum.addTaper(prev, p, prevR, r, 7, 0.07);
    prev = p;
    prevR = r;
  }
}

function branch(bark: MeshAccum, leaf: MeshAccum | null, origin: Vector3, dir: Vector3, length: number, clumps: number): void {
  const end = origin.add(dir.scale(length));
  bark.addTaper(origin, end, 0.065, 0.02, 4, 0.04);
  if (!leaf) return;
  for (let c = 1; c <= clumps; c += 1) {
    const t = 0.45 + (c / clumps) * 0.5;
    const at = origin.add(dir.scale(length * t));
    const up = new Vector3(dir.x * 0.2, 0.9, dir.z * 0.2).normalize();
    puff(leaf, at, up, 0.38 + (1 - t) * 0.28);
  }
}

function puff(leaf: MeshAccum, at: Vector3, up: Vector3, size: number): void {
  for (let k = 0; k < 3; k += 1) {
    const ang = k * 2.15 + size;
    const side = new Vector3(Math.cos(ang), 0.2, Math.sin(ang)).scale(size * 0.45);
    const base = at.add(side);
    leaf.addTaper(base, base.add(up.scale(size * 0.62)), size * 0.72, size * 0.16, 4, 0.22);
  }
}

function spruce(bark: MeshAccum, leaf: MeshAccum, height: number, spread: number): void {
  trunk(bark, height, 0.34, 0.08);
  for (let w = 0; w < 7; w += 1) {
    const t = 0.18 + (w / 7) * 0.74;
    const y = height * t;
    const arms = w % 2 === 0 ? 6 : 5;
    const reach = spread * (1.05 - t) ;
    for (let a = 0; a < arms; a += 1) {
      const ang = (a / arms) * Math.PI * 2 + w * 0.55;
      const droop = -0.28 - w * 0.02;
      const dir = new Vector3(Math.cos(ang), droop, Math.sin(ang)).normalize();
      branch(bark, leaf, new Vector3(Math.sin(t * 3) * 0.05, y, 0), dir, reach, 2);
    }
  }
  puff(leaf, new Vector3(0, height * 0.94, 0), Vector3.Up(), 0.62);
  for (let r = 0; r < 5; r += 1) {
    const ang = (r / 5) * Math.PI * 2;
    const dir = new Vector3(Math.cos(ang), 0.15, Math.sin(ang)).normalize();
    bark.addTaper(new Vector3(0, 0.15, 0), dir.scale(0.7), 0.1, 0.04, 4, 0.05);
  }
}

function pine(bark: MeshAccum, leaf: MeshAccum, height: number): void {
  trunk(bark, height, 0.3, 0.18);
  for (let w = 0; w < 4; w += 1) {
    const t = 0.48 + (w / 4) * 0.42;
    const y = height * t;
    const arms = 4;
    const reach = 1.7 * (1.15 - (t - 0.48));
    for (let a = 0; a < arms; a += 1) {
      const ang = (a / arms) * Math.PI * 2 + w * 0.9;
      const dir = new Vector3(Math.cos(ang), 0.22, Math.sin(ang)).normalize();
      branch(bark, leaf, new Vector3(0, y, 0), dir, reach, 3);
    }
  }
}

function snag(bark: MeshAccum, height: number): void {
  trunk(bark, height, 0.32, 0.22);
  const breakY = height * 0.72;
  bark.addTaper(new Vector3(0.05, breakY, 0), new Vector3(0.35, breakY + 0.45, 0.1), 0.12, 0.02, 5, 0.1);
  for (let a = 0; a < 4; a += 1) {
    const ang = (a / 4) * Math.PI * 2 + 0.4;
    const y = height * (0.35 + a * 0.1);
    const dir = new Vector3(Math.cos(ang), -0.15 + a * 0.08, Math.sin(ang)).normalize();
    bark.addTaper(new Vector3(0, y, 0), new Vector3(0, y, 0).add(dir.scale(1.1 + a * 0.15)), 0.06, 0.015, 4, 0);
  }
}

function familyOf(kind: Tree["kind"]): Family {
  if (kind === 3) return "snag";
  if (kind === 1) return "pine";
  return "spruce";
}

export function buildTreePrototypes(scene: Scene): TreePrototype[] {
  const barkTex = paintBark(scene);
  const families: { family: Family; height: number; spread: number }[] = [
    { family: "spruce", height: 9.2, spread: 2.5 },
    { family: "spruce", height: 7.4, spread: 2.1 },
    { family: "spruce", height: 11, spread: 2.8 },
    { family: "pine", height: 10.5, spread: 1.6 },
    { family: "pine", height: 8.2, spread: 1.4 },
    { family: "snag", height: 6.4, spread: 0 },
    { family: "snag", height: 8.1, spread: 0 },
    { family: "spruce", height: 6.2, spread: 1.8 },
  ];
  return families.map((spec, index) => {
    const bark = new MeshAccum();
    const leaf = spec.family === "snag" ? null : new MeshAccum();
    if (spec.family === "spruce" && leaf) spruce(bark, leaf, spec.height, spec.spread);
    else if (spec.family === "pine" && leaf) pine(bark, leaf, spec.height);
    else snag(bark, spec.height);
    const barkMesh = bark.bake(`tree-bark-${index}`, scene);
    const barkMat = pbr(scene, `bark-${index}`, spec.family === "snag" ? "#3a342c" : "#5a4636", 0.92, 0);
    barkMat.albedoTexture = barkTex;
    barkMesh.material = barkMat;
    let foliage: Mesh | null = null;
    if (leaf) {
      foliage = leaf.bake(`tree-leaf-${index}`, scene);
      const color = spec.family === "pine" ? "#2a4038" : index % 2 === 0 ? "#24382e" : "#31493a";
      const mat = pbr(scene, `needle-${index}`, color, 0.86, 0);
      mat.backFaceCulling = false;
      foliage.material = mat;
    }
    barkMesh.alwaysSelectAsActiveMesh = false;
    if (foliage) foliage.alwaysSelectAsActiveMesh = false;
    return { bark: barkMesh, foliage };
  });
}

export function prototypeIndex(tree: Tree, variant: number): number {
  const family = familyOf(tree.kind);
  if (family === "snag") return 5 + (variant % 2);
  if (family === "pine") return 3 + (variant % 2);
  return variant % 3 === 2 ? 7 : variant % 3;
}

export function treeMatrix(tree: Tree, y: number): { position: Vector3; rotation: Quaternion; scaling: Vector3 } {
  return {
    position: new Vector3(tree.x, y, tree.z),
    rotation: Quaternion.RotationYawPitchRoll(tree.rot, tree.tilt, 0),
    scaling: new Vector3(tree.scale, tree.scale, tree.scale),
  };
}

export function applyTreeTransform(mesh: AbstractMesh, tree: Tree, y: number): void {
  const pose = treeMatrix(tree, y);
  mesh.position.copyFrom(pose.position);
  mesh.rotationQuaternion = pose.rotation;
  mesh.scaling.copyFrom(pose.scaling);
}
