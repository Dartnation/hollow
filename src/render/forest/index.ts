import { CascadedShadowGenerator, Matrix, Scene, ShadowGenerator, Vector3, type DirectionalLight } from "@babylonjs/core";
import type { GameSim } from "../../sim/game";
import type { Tree } from "../../sim/types";
import { groundHeight } from "../../sim/world";
import { buildForestFloor } from "./floor";
import { FOREST_REFRESH_DISTANCE, forestMoved, lodTier, type LodTier } from "./lod";
import { placeThin } from "./thin";
import { buildStones } from "./rocks";
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
    const csm = new CascadedShadowGenerator(1024, moon);
    csm.numCascades = 1;
    csm.lambda = 0.85;
    csm.shadowMaxZ = 34;
    csm.stabilizeCascades = true;
    csm.autoCalcDepthBounds = true;
    csm.usePercentageCloserFiltering = true;
    csm.filteringQuality = ShadowGenerator.QUALITY_LOW;
    csm.bias = 0.006;
    for (const proto of prototypes) csm.addShadowCaster(proto.bark, false);
  } catch {
    /* Headless WebGL can refuse cascaded maps. The forest still renders. */
  }

  const placed: PlacedTree[] = sim.world.trees.map((tree) => {
    const pose = treeMatrix(tree, groundHeight(tree.x, tree.z));
    return {
      proto: prototypeIndex(tree, variant(tree)),
      x: tree.x,
      z: tree.z,
      matrix: Matrix.Compose(pose.scaling, pose.rotation, pose.position),
      tier: "far",
    };
  });
  const anchor = new Vector3(Number.NaN, 0, Number.NaN);

  const sync = (cam: Vector3, force: boolean) => {
    if (!force && !forestMoved(anchor.x, anchor.z, cam.x, cam.z)) return;
    let changed = force;
    for (const tree of placed) {
      const tier = lodTier(Math.hypot(tree.x - cam.x, tree.z - cam.z));
      if (tier !== tree.tier) {
        tree.tier = tier;
        changed = true;
      }
    }
    anchor.copyFrom(cam);
    if (!changed) return;
    const near: Matrix[][] = prototypes.map(() => []);
    const far: Matrix[][] = prototypes.map(() => []);
    for (const tree of placed) {
      const bucket = tree.tier === "near" ? near : far;
      bucket[tree.proto]?.push(tree.matrix);
    }
    prototypes.forEach((proto, index) => {
      placeThin(proto.bark, near[index] ?? []);
      if (proto.foliage) placeThin(proto.foliage, near[index] ?? []);
      placeThin(proto.far, far[index] ?? []);
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

export { FOREST_REFRESH_DISTANCE };
