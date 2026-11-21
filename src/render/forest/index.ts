import { CascadedShadowGenerator, Matrix, Scene, ShadowGenerator, Vector3, type DirectionalLight } from "@babylonjs/core";
import type { GameSim } from "../../sim/game";
import type { Tree } from "../../sim/types";
import { groundHeight } from "../../sim/world";
import { buildForestFloor } from "./floor";
import { FOREST_REFRESH_DISTANCE, forestMoved, lodTier, type LodTier } from "./lod";
import { placeThin } from "./thin";
import { buildStones } from "./rocks";
import { WORLD } from "../../sim/layout";
import { buildTreePrototypes, prototypeIndex, treeMatrix } from "./trees";
import { buildUndergrowth } from "./undergrowth";

export interface Forest {
  update(camera: Vector3, time: number): void;
  useShadows(generator: ShadowGenerator): void;
}

interface PlacedTree {
  proto: number;
  x: number;
  z: number;
  matrix: Matrix;
  tier: LodTier;
}

export function createForest(scene: Scene, sim: GameSim, moon: DirectionalLight): Forest {
  buildForestFloor(scene);
  buildUndergrowth(scene);
  buildStones(scene, sim);
  const prototypes = buildTreePrototypes(scene);
  try {
    const csm = new CascadedShadowGenerator(512, moon);
    csm.numCascades = 1;
    csm.lambda = 0.85;
    csm.shadowMaxZ = 24;
    csm.stabilizeCascades = true;
    csm.autoCalcDepthBounds = true;
    csm.usePercentageCloserFiltering = true;
    csm.filteringQuality = ShadowGenerator.QUALITY_LOW;
    csm.bias = 0.006;
    for (const proto of prototypes) csm.addShadowCaster(proto.bark, false);
  } catch {
    /* Headless WebGL can refuse cascaded maps. The forest still renders. */
  }

  const placed: PlacedTree[] = [...sim.world.trees, ...borderTrees()].map((tree) => {
    const pose = treeMatrix(tree, groundHeight(tree.x, tree.z));
    return {
      proto: prototypeIndex(tree, variant(tree)),
      x: tree.x,
      z: tree.z,
      matrix: Matrix.Compose(pose.scaling, pose.rotation, pose.position),
      tier: "far" as LodTier,
    };
  });
  const anchor = new Vector3(Number.NaN, 0, Number.NaN);

  const sync = (cam: Vector3, force: boolean) => {
    if (!force && !forestMoved(anchor.x, anchor.z, cam.x, cam.z)) return;
    let changed = force;
    for (const tree of placed) {
      const tier = lodTier(Math.hypot(tree.x - cam.x, tree.z - cam.z), force ? null : tree.tier);
      if (tier !== tree.tier) {
        tree.tier = tier;
        changed = true;
      }
    }
    anchor.copyFrom(cam);
    if (!changed) return;
    const near: Matrix[][] = prototypes.map(() => []);
    const mid: Matrix[][] = prototypes.map(() => []);
    const far: Matrix[][] = prototypes.map(() => []);
    for (const tree of placed) {
      const bucket = tree.tier === "near" ? near : tree.tier === "mid" ? mid : far;
      bucket[tree.proto]?.push(tree.matrix);
    }
    prototypes.forEach((proto, index) => {
      placeThin(proto.bark, near[index] ?? []);
      if (proto.foliage) placeThin(proto.foliage, near[index] ?? []);
      placeThin(proto.spine, [...(mid[index] ?? []), ...(far[index] ?? [])]);
      if (proto.mid) placeThin(proto.mid, mid[index] ?? []);
      if (proto.far) placeThin(proto.far, far[index] ?? []);
    });
  };

  sync(new Vector3(2.4, 2, 8), true);

  return {
    useShadows(generator) {
      for (const proto of prototypes) generator.addShadowCaster(proto.bark, false);
    },
    update(camera) {
      sync(camera, false);
    },
  };
}

function variant(tree: Tree): number {
  const n = Math.sin(tree.x * 12.3 + tree.z * 4.7) * 1000;
  return Math.abs(Math.floor((n - Math.floor(n)) * 8));
}

function borderTrees(): Tree[] {
  const trees: Tree[] = [];
  const step = 5.4;
  const pad = 3;
  const push = (x: number, z: number, i: number) => {
    const kind: Tree["kind"] = i % 8 === 0 ? 3 : i % 3 === 0 ? 1 : 0;
    trees.push({
      x,
      z,
      scale: 0.95 + (i % 4) * 0.12,
      rot: i * 0.65,
      tilt: ((i % 5) - 2) * 0.02,
      kind,
      trunkRadius: 0.18,
    });
  };
  let i = 0;
  for (let x = WORLD.minX + pad; x < WORLD.maxX - pad; x += step) {
    push(x, WORLD.minZ + pad, i);
    i += 1;
    push(x + step * 0.35, WORLD.maxZ - pad, i);
    i += 1;
    push(x, WORLD.minZ - 6, i + 2);
    i += 1;
    push(x, WORLD.maxZ + 6, i + 4);
    i += 1;
  }
  for (let z = WORLD.minZ + pad; z < WORLD.maxZ - pad; z += step) {
    push(WORLD.minX + pad, z, i);
    i += 1;
    push(WORLD.maxX - pad, z + step * 0.4, i);
    i += 1;
    push(WORLD.minX - 6, z, i + 3);
    i += 1;
    push(WORLD.maxX + 6, z, i + 5);
    i += 1;
  }
  return trees;
}

export { FOREST_REFRESH_DISTANCE };
