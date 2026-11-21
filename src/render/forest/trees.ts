import { type AbstractMesh, Mesh, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import type { Tree } from "../../sim/types";
import { MeshAccum } from "./mesh";
import { paintBark } from "./textures";
import { pbr } from "../materials";

export interface TreePrototype {
  bark: Mesh;
  foliage: Mesh | null;
  far: Mesh;
}

type Family = "spruce" | "pine" | "snag";

function trunk(accum: MeshAccum, height: number, baseR: number, bend: number): void {
  const segments = 5;
  let prev = new Vector3(0, 0, 0);
  let prevR = baseR;
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const y = height * t;
    const r = baseR * (1 - t * 0.7);
    const p = new Vector3(Math.sin(t * 2.6) * bend, y, Math.cos(t * 2.1) * bend * 0.65);
    accum.addTaper(prev, p, prevR, r, 5, 0.08);
    prev = p;
    prevR = r;
  }
}

function clump(leaf: MeshAccum, at: Vector3, axis: Vector3, radius: number): void {
  const dir = axis.lengthSquared() > 0.0001 ? axis.normalize() : Vector3.Up();
  const len = Math.max(0.18, radius * 0.72);
  leaf.addTaper(at, at.add(dir.scale(len)), radius, radius * 0.28, 6, 0.06);
}

function spruce(bark: MeshAccum, leaf: MeshAccum, height: number, spread: number, salt: number): void {
  trunk(bark, height, 0.3, 0.1 + (salt % 3) * 0.04);
  const whorls = 4;
  for (let w = 0; w < whorls; w += 1) {
    const t = 0.22 + (w / whorls) * 0.7;
    const y = height * t;
    const arms = 3 + ((w + salt) % 2);
    for (let a = 0; a < arms; a += 1) {
      const ang = (a / arms) * Math.PI * 2 + w * 1.15 + salt * 0.41;
      const droop = -0.55 + ((a + w + salt) % 3) * 0.16;
      const len = spread * (1.15 - t) * (0.62 + ((a * 3 + w + salt) % 3) * 0.16);
      const dir = new Vector3(Math.cos(ang), droop, Math.sin(ang)).normalize();
      const origin = new Vector3(Math.sin(w * 1.7 + salt) * 0.06, y, Math.cos(w * 1.3) * 0.05);
      bark.addTaper(origin, origin.add(dir.scale(len)), 0.055, 0.016, 4, 0.04);
      for (const along of [0.4, 0.66, 0.9]) {
        const mass = origin.add(dir.scale(len * along));
        const hang = new Vector3(dir.x * 0.25, -0.35 + along * 0.55, dir.z * 0.25);
        clump(leaf, mass, hang, 0.3 + (1 - t) * 0.16);
      }
    }
  }
  clump(leaf, new Vector3(0.03, height * 0.92, 0), Vector3.Up(), 0.2);
  for (let r = 0; r < 3; r += 1) {
    const ang = (r / 3) * Math.PI * 2 + salt * 0.5;
    const dir = new Vector3(Math.cos(ang), 0.06, Math.sin(ang));
    bark.addTaper(new Vector3(0, 0.08, 0), dir.scale(0.5 + (r % 2) * 0.28), 0.11, 0.03, 3, 0);
  }
}

function pine(bark: MeshAccum, leaf: MeshAccum, height: number, salt: number): void {
  trunk(bark, height, 0.26, 0.18 + salt * 0.02);
  for (let w = 0; w < 4; w += 1) {
    const t = 0.52 + (w / 4) * 0.4;
    const y = height * t;
    const arms = 3;
    for (let a = 0; a < arms; a += 1) {
      const ang = (a / arms) * Math.PI * 2 + w * 1.15 + salt;
      const dir = new Vector3(Math.cos(ang), -0.05 + (a % 2) * 0.38, Math.sin(ang)).normalize();
      const len = 1.05 + (1 - (t - 0.52)) * 1.25 + (a === 1 ? 0.4 : 0);
      const origin = new Vector3(Math.sin(salt + w) * 0.05, y, 0);
      const end = origin.add(dir.scale(len));
      bark.addTaper(origin, end, 0.05, 0.014, 4, 0);
      const tuft = origin.add(dir.scale(len * 0.62));
      clump(leaf, tuft, new Vector3(dir.x * 0.4, 0.55, dir.z * 0.4), 0.24);
      clump(leaf, tuft.add(dir.scale(0.18)), new Vector3(-dir.z, 0.2, dir.x), 0.16);
    }
  }
  for (let r = 0; r < 3; r += 1) {
    const ang = (r / 3) * Math.PI * 2 + 0.6;
    bark.addTaper(new Vector3(0, 0.1, 0), new Vector3(Math.cos(ang), 0.05, Math.sin(ang)).scale(0.62), 0.1, 0.03, 3, 0);
  }
}

function snag(bark: MeshAccum, height: number, salt: number): void {
  trunk(bark, height * 0.76, 0.32, 0.22);
  const top = height * 0.68;
  bark.addTaper(new Vector3(0.02, top, 0), new Vector3(0.42, top + 0.28, 0.16), 0.15, 0.02, 4, 0.25);
  for (let a = 0; a < 4; a += 1) {
    const ang = (a / 4) * Math.PI * 2 + salt;
    const y = height * (0.26 + a * 0.11);
    const dir = new Vector3(Math.cos(ang), -0.42 + a * 0.14, Math.sin(ang)).normalize();
    const len = 0.65 + (a % 3) * 0.4;
    bark.addTaper(new Vector3(0, y, 0), new Vector3(0, y, 0).add(dir.scale(len)), 0.055, 0.012, 3, 0);
  }
}

function farConifer(accum: MeshAccum, height: number, spread: number, salt: number): void {
  accum.addTaper(new Vector3(0, 0, 0), new Vector3(0.05 * salt, height * 0.9, 0), 0.2, 0.035, 4, 0);
  for (let i = 0; i < 8; i += 1) {
    const t = 0.28 + (i / 8) * 0.66;
    const ang = i * 2.35 + salt * 0.7;
    const reach = spread * (1.02 - t) * 0.48;
    const at = new Vector3(Math.cos(ang) * reach, height * t, Math.sin(ang) * reach);
    clump(accum, at, new Vector3(Math.cos(ang) * 0.2, -0.15, Math.sin(ang) * 0.2), 0.4 + (1 - t) * 0.22);
  }
}

function farSnag(accum: MeshAccum, height: number): void {
  accum.addTaper(new Vector3(0, 0, 0), new Vector3(0.16, height * 0.7, 0.05), 0.26, 0.05, 4, 0.08);
  accum.addTaper(new Vector3(0, height * 0.45, 0), new Vector3(0.7, height * 0.5, 0.2), 0.06, 0.015, 3, 0);
}

function familyOf(kind: Tree["kind"]): Family {
  if (kind === 3) return "snag";
  if (kind === 1) return "pine";
  return "spruce";
}

export function buildTreePrototypes(scene: Scene): TreePrototype[] {
  const barkTex = paintBark(scene);
  const families: { family: Family; height: number; spread: number }[] = [
    { family: "spruce", height: 9.4, spread: 2.6 },
    { family: "spruce", height: 7.2, spread: 2.15 },
    { family: "spruce", height: 11.2, spread: 2.9 },
    { family: "pine", height: 10.8, spread: 1.7 },
    { family: "pine", height: 8.4, spread: 1.45 },
    { family: "snag", height: 6.6, spread: 0 },
    { family: "snag", height: 8.3, spread: 0 },
    { family: "spruce", height: 6.1, spread: 1.9 },
  ];
  return families.map((spec, index) => {
    const bark = new MeshAccum();
    const leaf = spec.family === "snag" ? null : new MeshAccum();
    const salt = index + 1;
    if (spec.family === "spruce" && leaf) spruce(bark, leaf, spec.height, spec.spread, salt);
    else if (spec.family === "pine" && leaf) pine(bark, leaf, spec.height, salt);
    else snag(bark, spec.height, salt);
    const barkMesh = bark.bake(`tree-bark-${index}`, scene);
    const barkMat = pbr(scene, `bark-${index}`, spec.family === "snag" ? "#3a342c" : "#5c4838", 0.92, 0);
    barkMat.albedoTexture = barkTex;
    barkMesh.material = barkMat;
    let foliage: Mesh | null = null;
    if (leaf) {
      foliage = leaf.bake(`tree-leaf-${index}`, scene);
      const color = spec.family === "pine" ? "#4a6854" : index % 2 === 0 ? "#3c5b48" : "#345244";
      const mat = pbr(scene, `needle-${index}`, color, 0.84, 0);
      mat.backFaceCulling = false;
      foliage.material = mat;
    }
    const farAccum = new MeshAccum();
    if (spec.family === "snag") farSnag(farAccum, spec.height);
    else farConifer(farAccum, spec.height, Math.max(spec.spread, 1.4), salt);
    const far = farAccum.bake(`tree-far-${index}`, scene);
    const farMat = pbr(scene, `far-${index}`, spec.family === "snag" ? "#3a342c" : "#2c4638", 0.9, 0);
    far.material = farMat;
    for (const mesh of [barkMesh, foliage, far]) {
      if (!mesh) continue;
      mesh.alwaysSelectAsActiveMesh = false;
      mesh.isPickable = false;
    }
    return { bark: barkMesh, foliage, far };
  });
}

export function prototypeIndex(tree: Tree, variant: number): number {
  const family = familyOf(tree.kind);
  if (family === "snag") return 5 + (variant % 2);
  if (family === "pine") return 3 + (variant % 2);
  const spruce = [0, 1, 2, 7];
  return spruce[variant % spruce.length] ?? 0;
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
