import { CascadedShadowGenerator, Matrix, Mesh, Scene, ShadowGenerator, Vector3, type DirectionalLight } from "@babylonjs/core";
import type { GameSim } from "../../sim/game";
import type { Tree } from "../../sim/types";
import { groundHeight } from "../../sim/world";
import { buildForestFloor } from "./floor";
import { FOREST_DRAW_DISTANCE, FOREST_REFRESH_DISTANCE, forestMoved, lodTier, type LodTier } from "./lod";
import { placeThin } from "./thin";
import { buildStones } from "./rocks";
import { WORLD } from "../../sim/layout";
import { loadImportedForest, type SpeciesMeshes } from "./imported";
import { treeMatrix, treeSpecies, treeVisualScale } from "./trees";
import { buildUndergrowth } from "./undergrowth";

export interface Forest {
  update(camera: Vector3, time: number): void;
  useShadows(generator: ShadowGenerator): void;
}

interface PlacedTree {
  species: SpeciesMeshes;
  x: number;
  z: number;
  matrix: Matrix;
  tier: LodTier;
  hidden: boolean;
  wasHidden: boolean;
}

export async function createForest(scene: Scene, sim: GameSim, moon: DirectionalLight): Promise<Forest> {
  buildForestFloor(scene);
  buildUndergrowth(scene);
  buildStones(scene, sim);
  const imported = await loadImportedForest(scene);
  const speciesOf = { fir: imported.fir, pine: imported.pine, snag: imported.snag };
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
    for (const mesh of imported.shadows) csm.addShadowCaster(mesh, false);
  } catch {
    /* Headless WebGL can refuse cascaded maps. The forest still renders. */
  }

  const placed: PlacedTree[] = [...sim.world.trees, ...borderTrees()].map((tree) => {
    const pose = treeMatrix({ ...tree, scale: treeVisualScale(tree, variant(tree)) }, groundHeight(tree.x, tree.z));
    return {
      species: speciesOf[treeSpecies(tree)],
      x: tree.x,
      z: tree.z,
      matrix: Matrix.Compose(pose.scaling, pose.rotation, pose.position),
      tier: "far" as LodTier,
      hidden: true,
      wasHidden: true,
    };
  });
  const anchor = new Vector3(Number.NaN, 0, Number.NaN);
  const allMeshes = [...imported.fir.near, ...imported.fir.mid, ...imported.fir.far, ...imported.pine.near, ...imported.pine.mid, ...imported.pine.far, ...imported.snag.near, ...imported.snag.mid, ...imported.snag.far];

  const sync = (cam: Vector3, force: boolean) => {
    if (!force && !forestMoved(anchor.x, anchor.z, cam.x, cam.z)) return;
    let changed = force;
    for (const tree of placed) {
      const distance = Math.hypot(tree.x - cam.x, tree.z - cam.z);
      const tier = distance > FOREST_DRAW_DISTANCE ? "far" : lodTier(distance, force ? null : tree.tier);
      tree.hidden = distance > FOREST_DRAW_DISTANCE;
      if (tier !== tree.tier || tree.hidden !== tree.wasHidden) {
        tree.tier = tier;
        tree.wasHidden = tree.hidden;
        changed = true;
      }
    }
    anchor.copyFrom(cam);
    if (!changed) return;
    const groups = new Map<Mesh, Matrix[]>();
    for (const tree of placed) {
      if (tree.hidden) continue;
      const parts = tree.tier === "near" ? tree.species.near : tree.tier === "mid" ? tree.species.mid : tree.species.far;
      for (const mesh of parts) {
        const list = groups.get(mesh) ?? [];
        list.push(tree.matrix);
        groups.set(mesh, list);
      }
    }
    for (const mesh of allMeshes) placeThin(mesh, groups.get(mesh) ?? []);
  };

  sync(new Vector3(2.4, 2, 8), true);

  return {
    useShadows(generator) {
      for (const mesh of imported.shadows) generator.addShadowCaster(mesh, false);
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
