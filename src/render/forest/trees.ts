import { type AbstractMesh, Mesh, PBRMaterial, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import type { Tree } from "../../sim/types";
import { pbr } from "../materials";
import { MeshAccum } from "./mesh";
import { paintBark, paintNeedles } from "./textures";

export interface TreePrototype {
  bark: Mesh;
  foliage: Mesh | null;
  spine: Mesh;
  mid: Mesh | null;
  far: Mesh | null;
}

type Family = "spruce" | "pine" | "snag";

function trunk(accum: MeshAccum, height: number, baseR: number, bend: number): void {
  const segments = 5;
  let prev = new Vector3(0, 0, 0);
  let prevR = baseR * 1.35;
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const y = height * t;
    const flare = t < 0.18 ? 1.35 - t : 1;
    const r = baseR * (1 - t * 0.72) * flare;
    const p = new Vector3(Math.sin(t * 2.2) * bend, y, Math.cos(t * 1.8) * bend * 0.6);
    accum.addTaper(prev, p, prevR, Math.max(0.04, r), 6, 0.06);
    prev = p;
    prevR = Math.max(0.04, r);
  }
}

function shelves(leaf: MeshAccum, height: number, spread: number, count: number, salt: number, dead: boolean, from = 0.16): void {
  for (let i = 0; i < count; i += 1) {
    if (dead && (i + salt) % 3 === 0) continue;
    const t = from + (i / Math.max(1, count - 1)) * (0.94 - from);
    const y = height * t;
    const radius = spread * (1.12 - (t - from) * 0.8);
    const yaw = i * 0.65 + salt * 0.37;
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const at = new Vector3(0, y, 0);
    const hang = new Vector3(0, 1, 0);
    leaf.addCard(at, new Vector3(c, -0.12, s), hang, radius * 2.05, Math.max(0.42, radius * 0.5));
    leaf.addCard(at, new Vector3(-s, -0.1, c), hang, radius * 1.9, Math.max(0.4, radius * 0.46));
  }
}

function spruce(bark: MeshAccum, leaf: MeshAccum, height: number, spread: number, salt: number, dead = false): void {
  trunk(bark, height, 0.26, 0.05 + (salt % 3) * 0.02);
  shelves(leaf, height, spread, dead ? 6 : 8, salt, dead);
  for (let r = 0; r < 4; r += 1) {
    const ang = (r / 4) * Math.PI * 2 + salt;
    const dir = new Vector3(Math.cos(ang), 0.05, Math.sin(ang));
    bark.addTaper(new Vector3(0, 0.06, 0), dir.scale(0.5 + (r % 2) * 0.28), 0.11, 0.03, 4, 0);
  }
}

function pine(bark: MeshAccum, leaf: MeshAccum, height: number, salt: number): void {
  trunk(bark, height, 0.24, 0.14);
  shelves(leaf, height, 1.65, 5, salt, false, 0.5);
}

function snag(bark: MeshAccum, height: number, salt: number): void {
  trunk(bark, height * 0.72, 0.3, 0.2);
  const top = height * 0.64;
  bark.addTaper(new Vector3(0, top, 0), new Vector3(0.35, top + 0.22, 0.12), 0.14, 0.02, 4, 0.2);
  for (let a = 0; a < 4; a += 1) {
    const ang = (a / 4) * Math.PI * 2 + salt;
    const y = height * (0.24 + a * 0.1);
    const dir = new Vector3(Math.cos(ang), -0.4 + a * 0.12, Math.sin(ang)).normalize();
    bark.addTaper(new Vector3(0, y, 0), new Vector3(0, y, 0).add(dir.scale(0.7 + (a % 3) * 0.35)), 0.05, 0.01, 3, 0);
  }
}

function cheapTrunk(accum: MeshAccum, height: number, salt: number): void {
  accum.addTaper(new Vector3(0, 0, 0), new Vector3(0.05 * salt, height * 0.94, 0), 0.18, 0.035, 4, 0.04);
}

function familyOf(kind: Tree["kind"]): Family {
  if (kind === 3) return "snag";
  if (kind === 1) return "pine";
  return "spruce";
}

function cutout(scene: Scene, name: string, hex: string): PBRMaterial {
  const material = pbr(scene, name, hex, 0.92, 0);
  material.useAlphaFromAlbedoTexture = true;
  material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
  material.alphaCutOff = 0.35;
  material.backFaceCulling = false;
  material.twoSidedLighting = true;
  return material;
}

export function buildTreePrototypes(scene: Scene): TreePrototype[] {
  const barkTex = paintBark(scene);
  const needles = paintNeedles(scene);
  const specs: { family: Family; height: number; spread: number; dead?: boolean }[] = [
    { family: "spruce", height: 9.2, spread: 2.7 },
    { family: "spruce", height: 6.4, spread: 1.9 },
    { family: "spruce", height: 8.4, spread: 2.2, dead: true },
    { family: "pine", height: 11, spread: 1.6 },
    { family: "pine", height: 8.1, spread: 1.35 },
    { family: "snag", height: 6.8, spread: 0 },
    { family: "snag", height: 8.6, spread: 0 },
    { family: "spruce", height: 5.2, spread: 1.55 },
  ];
  return specs.map((spec, index) => {
    const salt = index + 1;
    const bark = new MeshAccum();
    const leaf = spec.family === "snag" ? null : new MeshAccum();
    if (spec.family === "spruce" && leaf) spruce(bark, leaf, spec.height, spec.spread, salt, spec.dead === true);
    else if (spec.family === "pine" && leaf) pine(bark, leaf, spec.height, salt);
    else snag(bark, spec.height, salt);

    const barkMesh = bark.bake(`tree-bark-${index}`, scene);
    const barkMat = pbr(scene, `bark-${index}`, spec.family === "snag" ? "#3a342c" : "#4e3c30", 0.94, 0);
    barkMat.albedoTexture = barkTex;
    barkMesh.material = barkMat;

    let foliage: Mesh | null = null;
    if (leaf) {
      foliage = leaf.bake(`tree-leaf-${index}`, scene);
      const mat = cutout(scene, `needle-${index}`, "#e4ebe4");
      mat.albedoTexture = needles;
      foliage.material = mat;
    }

    const spineAccum = new MeshAccum();
    if (spec.family === "snag") snag(spineAccum, spec.height, salt);
    else cheapTrunk(spineAccum, spec.height, salt);
    const spine = spineAccum.bake(`tree-spine-${index}`, scene);
    const spineMat = pbr(scene, `spine-${index}`, spec.family === "snag" ? "#3a342c" : "#4a3b2e", 0.95, 0);
    spineMat.albedoTexture = barkTex;
    spine.material = spineMat;

    const midAccum = new MeshAccum();
    const farAccum = new MeshAccum();
    if (spec.family === "spruce") {
      shelves(midAccum, spec.height, Math.max(spec.spread, 1.3), 6, salt, spec.dead === true);
      shelves(farAccum, spec.height, Math.max(spec.spread, 1.2), 5, salt, spec.dead === true);
    } else if (spec.family === "pine") {
      shelves(midAccum, spec.height, 1.55, 4, salt, false, 0.5);
      shelves(farAccum, spec.height, 1.45, 4, salt, false, 0.52);
    }
    const mid = spec.family === "snag" ? null : midAccum.bake(`tree-mid-${index}`, scene);
    const far = spec.family === "snag" ? null : farAccum.bake(`tree-far-${index}`, scene);
    if (mid) {
      const midMat = cutout(scene, `mid-${index}`, "#d5ddd4");
      midMat.albedoTexture = needles;
      mid.material = midMat;
    }
    if (far) {
      const farMat = cutout(scene, `far-${index}`, "#c9d2c8");
      farMat.albedoTexture = needles;
      far.material = farMat;
    }

    for (const mesh of [barkMesh, foliage, spine, mid, far]) {
      if (!mesh) continue;
      mesh.alwaysSelectAsActiveMesh = false;
      mesh.isPickable = false;
    }
    return { bark: barkMesh, foliage, spine, mid, far };
  });
}

export function prototypeIndex(tree: Tree, variant: number): number {
  const family = familyOf(tree.kind);
  if (family === "snag") return 5 + (variant % 2);
  if (family === "pine") return 3 + (variant % 2);
  const spruceIds = [0, 1, 2, 7];
  return spruceIds[variant % spruceIds.length] ?? 0;
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
