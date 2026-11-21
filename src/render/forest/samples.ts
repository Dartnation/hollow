import { Mesh, PBRMaterial, Scene, Vector3 } from "@babylonjs/core";
import { MeshAccum } from "./mesh";

export interface SampleCounts {
  spruce: number;
  pine: number;
  fern: number;
}

function perp(dir: Vector3): Vector3 {
  const helper = Math.abs(dir.y) > 0.9 ? Vector3.Right() : Vector3.Up();
  return Vector3.Cross(dir, helper).normalize();
}

function trunk(accum: MeshAccum, height: number, baseR: number): void {
  const segments = 8;
  let prev = new Vector3(0, 0, 0);
  let prevR = baseR * 1.45;
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const flare = t < 0.16 ? 1.55 - t * 2 : 1;
    const r = baseR * (1 - t * 0.68) * flare;
    const p = new Vector3(Math.sin(t * 2.4) * 0.08, height * t, Math.cos(t * 1.7) * 0.05);
    accum.addTaper(prev, p, prevR, Math.max(0.035, r), 7, 0.08);
    prev = p;
    prevR = Math.max(0.035, r);
  }
  for (let r = 0; r < 5; r += 1) {
    const ang = (r / 5) * Math.PI * 2 + 0.4;
    const dir = new Vector3(Math.cos(ang), 0.08, Math.sin(ang));
    accum.addTaper(new Vector3(0, 0.05, 0), dir.scale(0.55 + (r % 2) * 0.35), baseR * 0.7, 0.04, 5, 0);
  }
}

function tufts(leaf: MeshAccum, origin: Vector3, dir: Vector3, length: number, size: number): void {
  const side = perp(dir);
  const up = Vector3.Cross(dir, side).normalize();
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const t = 0.28 + (i / count) * 0.66;
    const at = origin.add(dir.scale(length * t));
    const spin = i * 1.35;
    const a = side.scale(Math.cos(spin)).add(up.scale(Math.sin(spin)));
    const b = side.scale(-Math.sin(spin)).add(up.scale(Math.cos(spin)));
    const w = size * (1.05 - t * 0.35);
    leaf.addCard(at, a, dir, w, w * 0.62);
    leaf.addCard(at, b, dir, w * 0.82, w * 0.5);
  }
}

function limb(bark: MeshAccum, leaf: MeshAccum, origin: Vector3, dir: Vector3, length: number, radius: number, size: number): void {
  const end = origin.add(dir.scale(length));
  bark.addTaper(origin, end, radius, radius * 0.28, 5, 0.06);
  tufts(leaf, origin, dir, length, size);
  const fork = origin.add(dir.scale(length * 0.62));
  const side = perp(dir);
  const forkDir = dir.scale(0.75).add(side.scale(0.55)).add(new Vector3(0, -0.2, 0)).normalize();
  const forkEnd = fork.add(forkDir.scale(length * 0.42));
  bark.addTaper(fork, forkEnd, radius * 0.45, radius * 0.12, 4, 0.04);
  tufts(leaf, fork, forkDir, length * 0.42, size * 0.75);
}

function fillSpruce(bark: MeshAccum, leaf: MeshAccum): void {
  const height = 8.6;
  trunk(bark, height, 0.24);
  const whorls = 8;
  for (let w = 0; w < whorls; w += 1) {
    const t = 0.16 + (w / (whorls - 1)) * 0.78;
    const y = height * t;
    const arms = w % 3 === 0 ? 4 : 5;
    for (let a = 0; a < arms; a += 1) {
      if (w === 2 && a === 1) continue;
      if (w === 5 && a === 3) continue;
      const ang = (a / arms) * Math.PI * 2 + w * 0.62 + (a % 2) * 0.18;
      const droop = -0.15 - (1 - t) * 0.7;
      const dir = new Vector3(Math.cos(ang), droop, Math.sin(ang)).normalize();
      const len = (2.55 * (1.05 - t) + 0.35) * (0.82 + (a % 3) * 0.12);
      limb(bark, leaf, new Vector3(Math.sin(w) * 0.04, y, 0), dir, len, 0.055, 0.7);
    }
  }
}

function fillPine(bark: MeshAccum, leaf: MeshAccum): void {
  const height = 11.2;
  trunk(bark, height, 0.22);
  for (let w = 0; w < 5; w += 1) {
    const t = 0.52 + w * 0.09;
    const y = height * t;
    const arms = w === 4 ? 3 : 4;
    for (let a = 0; a < arms; a += 1) {
      if (w === 1 && a === 2) continue;
      const ang = (a / arms) * Math.PI * 2 + w * 0.9;
      const lift = 0.22 - w * 0.08;
      const dir = new Vector3(Math.cos(ang), lift, Math.sin(ang)).normalize();
      const len = 1.7 + (1 - w / 5) * 1.15;
      limb(bark, leaf, new Vector3(0, y, Math.cos(w) * 0.03), dir, len, 0.05, 0.78);
    }
  }
}

function fillFern(bark: MeshAccum, leaf: MeshAccum): void {
  bark.addTaper(new Vector3(0, 0, 0), new Vector3(0, 0.16, 0), 0.03, 0.012, 4, 0);
  for (let i = 0; i < 7; i += 1) {
    const ang = (i / 7) * Math.PI * 2 + (i % 2) * 0.15;
    const dir = new Vector3(Math.cos(ang) * 0.72, 0.62 - (i % 3) * 0.08, Math.sin(ang) * 0.72).normalize();
    const len = 0.55 + (i % 3) * 0.12;
    const origin = new Vector3(0, 0.05, 0);
    bark.addTaper(origin, origin.add(dir.scale(len)), 0.012, 0.004, 3, 0);
    const side = perp(dir);
    leaf.addCard(origin.add(dir.scale(len * 0.55)), side, dir, 0.62, len * 1.15);
  }
}

export function sampleCounts(): SampleCounts {
  const spruceBark = new MeshAccum();
  const spruceLeaf = new MeshAccum();
  fillSpruce(spruceBark, spruceLeaf);
  const pineBark = new MeshAccum();
  const pineLeaf = new MeshAccum();
  fillPine(pineBark, pineLeaf);
  const fernBark = new MeshAccum();
  const fernLeaf = new MeshAccum();
  fillFern(fernBark, fernLeaf);
  return {
    spruce: spruceBark.indexCount() + spruceLeaf.indexCount(),
    pine: pineBark.indexCount() + pineLeaf.indexCount(),
    fern: fernBark.indexCount() + fernLeaf.indexCount(),
  };
}

function cutout(scene: Scene, name: string): PBRMaterial {
  const material = new PBRMaterial(name, scene);
  material.albedoColor.set(0.9, 0.94, 0.88);
  material.roughness = 0.9;
  material.metallic = 0;
  material.useAlphaFromAlbedoTexture = true;
  material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
  material.alphaCutOff = 0.35;
  material.backFaceCulling = false;
  material.twoSidedLighting = true;
  return material;
}

export function bakeSampleSpruce(scene: Scene, cluster: PBRMaterial["albedoTexture"]): { bark: Mesh; foliage: Mesh } {
  const bark = new MeshAccum();
  const leaf = new MeshAccum();
  fillSpruce(bark, leaf);
  const barkMesh = bark.bake("sample-spruce-bark", scene);
  const foliage = leaf.bake("sample-spruce-leaf", scene);
  foliage.material = cutout(scene, "sample-spruce-needles");
  if (foliage.material instanceof PBRMaterial) foliage.material.albedoTexture = cluster;
  return { bark: barkMesh, foliage };
}

export function bakeSamplePine(scene: Scene, cluster: PBRMaterial["albedoTexture"]): { bark: Mesh; foliage: Mesh } {
  const bark = new MeshAccum();
  const leaf = new MeshAccum();
  fillPine(bark, leaf);
  const barkMesh = bark.bake("sample-pine-bark", scene);
  const foliage = leaf.bake("sample-pine-leaf", scene);
  foliage.material = cutout(scene, "sample-pine-needles");
  if (foliage.material instanceof PBRMaterial) foliage.material.albedoTexture = cluster;
  return { bark: barkMesh, foliage };
}

export function bakeSampleFern(scene: Scene, frond: PBRMaterial["albedoTexture"]): { bark: Mesh; foliage: Mesh } {
  const bark = new MeshAccum();
  const leaf = new MeshAccum();
  fillFern(bark, leaf);
  const barkMesh = bark.bake("sample-fern-stem", scene);
  const foliage = leaf.bake("sample-fern-leaf", scene);
  foliage.material = cutout(scene, "sample-fern");
  if (foliage.material instanceof PBRMaterial) foliage.material.albedoTexture = frond;
  return { bark: barkMesh, foliage };
}
