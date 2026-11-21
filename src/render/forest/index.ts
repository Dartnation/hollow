import {
  CascadedShadowGenerator,
  InstancedMesh,
  Matrix,
  Mesh,
  Quaternion,
  Scene,
  ShadowGenerator,
  Vector3,
  type DirectionalLight,
} from "@babylonjs/core";
import type { GameSim } from "../../sim/game";
import type { Tree } from "../../sim/types";
import { groundHeight } from "../../sim/world";
import { buildForestFloor } from "./floor";
import { applyTreeTransform, buildTreePrototypes, prototypeIndex, type TreePrototype } from "./trees";
import { buildStones } from "./rocks";
import { buildUndergrowth } from "./undergrowth";

const NEAR = 28;

export interface Forest {
  update(camera: Vector3, time: number): void;
  useShadows(generator: ShadowGenerator): void;
}

export function createForest(scene: Scene, sim: GameSim, moon: DirectionalLight): Forest {
  buildForestFloor(scene);
  buildUndergrowth(scene);
  buildStones(scene, sim);
  const prototypes = buildTreePrototypes(scene);
  const generators: ShadowGenerator[] = [];
  try {
    const csm = new CascadedShadowGenerator(1024, moon);
    csm.numCascades = 2;
    csm.lambda = 0.7;
    csm.shadowMaxZ = 46;
    csm.stabilizeCascades = true;
    csm.autoCalcDepthBounds = true;
    csm.usePercentageCloserFiltering = true;
    csm.filteringQuality = ShadowGenerator.QUALITY_LOW;
    csm.bias = 0.006;
    generators.push(csm);
  } catch {
    /* Headless WebGL can refuse cascaded maps. The forest still renders. */
  }

  let near: InstancedMesh[] = [];
  const bases = new Map<number, Quaternion>();
  let last = new Vector3(2.4, 2, 8);

  const refresh = (cam: Vector3) => {
    for (const mesh of near) {
      for (const generator of generators) generator.removeShadowCaster(mesh);
      mesh.dispose();
    }
    near = [];
    bases.clear();
    const far: Tree[][] = prototypes.map(() => []);
    for (const tree of sim.world.trees) {
      const index = prototypeIndex(tree, variant(tree));
      const distance = Math.hypot(tree.x - cam.x, tree.z - cam.z);
      if (distance < NEAR) spawnNear(prototypes[index], tree, near, bases, generators);
      else far[index]?.push(tree);
    }
    prototypes.forEach((proto, index) => {
      park(proto.bark, far[index] ?? []);
      if (proto.foliage) park(proto.foliage, far[index] ?? []);
    });
  };
  refresh(last);

  return {
    useShadows(generator) {
      generators.push(generator);
      for (const mesh of near) generator.addShadowCaster(mesh, false);
    },
    update(camera, time) {
      if (Vector3.DistanceSquared(last, camera) > 16) {
        last.copyFrom(camera);
        refresh(camera);
      }
      const gust = Math.sin(time * 0.85) * 0.018;
      for (const mesh of near) {
        if (!mesh.name.startsWith("near-leaf")) continue;
        const base = bases.get(mesh.uniqueId);
        if (!base) continue;
        mesh.rotationQuaternion = base.multiply(Quaternion.FromEulerAngles(0, 0, gust + Math.sin(mesh.position.x) * 0.01));
      }
    },
  };
}

function variant(tree: Tree): number {
  const n = Math.sin(tree.x * 12.3 + tree.z * 4.7) * 1000;
  return Math.abs(Math.floor((n - Math.floor(n)) * 8));
}

function spawnNear(
  proto: TreePrototype | undefined,
  tree: Tree,
  near: InstancedMesh[],
  bases: Map<number, Quaternion>,
  generators: readonly ShadowGenerator[],
): void {
  if (!proto) return;
  const y = groundHeight(tree.x, tree.z);
  const spawned: InstancedMesh[] = [];
  const bark = proto.bark.createInstance(`near-bark-${tree.x.toFixed(1)}`);
  applyTreeTransform(bark, tree, y);
  spawned.push(bark);
  if (proto.foliage) {
    const leaf = proto.foliage.createInstance(`near-leaf-${tree.x.toFixed(1)}`);
    applyTreeTransform(leaf, tree, y);
    if (leaf.rotationQuaternion) bases.set(leaf.uniqueId, leaf.rotationQuaternion.clone());
    spawned.push(leaf);
  }
  for (const mesh of spawned) {
    near.push(mesh);
    for (const generator of generators) generator.addShadowCaster(mesh, false);
  }
}

function park(mesh: Mesh, trees: readonly Tree[]): void {
  if (!trees.length) {
    mesh.position.set(0, -40, 0);
    mesh.scaling.setAll(0);
    mesh.thinInstanceCount = 0;
    return;
  }
  const first = trees[0];
  if (!first) return;
  applyTreeTransform(mesh, first, groundHeight(first.x, first.z));
  const rest = trees.slice(1);
  if (!rest.length) {
    mesh.thinInstanceCount = 0;
    return;
  }
  const buffer = new Float32Array(rest.length * 16);
  const matrix = new Matrix();
  rest.forEach((tree, index) => {
    Matrix.ComposeToRef(
      new Vector3(tree.scale, tree.scale, tree.scale),
      Quaternion.RotationYawPitchRoll(tree.rot, tree.tilt, 0),
      new Vector3(tree.x, groundHeight(tree.x, tree.z), tree.z),
      matrix,
    );
    matrix.copyToArray(buffer, index * 16);
  });
  mesh.thinInstanceSetBuffer("matrix", buffer, 16, false);
}
