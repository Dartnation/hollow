import { Color3, MeshBuilder, PBRMaterial, type Scene, type TransformNode } from "@babylonjs/core";
import { HUNT } from "../../sim/layout";
import { groundHeight } from "../../sim/world";
import { hingedDoor } from "./door";
import { box, gable, post } from "./parts";
import { cabinMaterials } from "./textures";

/**
 * Smaller abandoned cabin east of the escape path.
 * Seed 170147 and 22011 both leave this rectangle empty of trunks.
 */
export function buildHunter(scene: Scene): TransformNode {
  const y = groundHeight((HUNT.minX + HUNT.maxX) / 2, (HUNT.minZ + HUNT.maxZ) / 2);
  const mats = cabinMaterials(scene);
  mats.plankDark.albedoColor = Color3.FromHexString("#6a5848");
  mats.roof.albedoColor = Color3.FromHexString("#9a968e");
  mats.floor.albedoColor = Color3.FromHexString("#b7a894");
  const cx = (HUNT.minX + HUNT.maxX) / 2;
  const cz = (HUNT.minZ + HUNT.maxZ) / 2;
  const w = HUNT.maxX - HUNT.minX;
  const d = HUNT.maxZ - HUNT.minZ;

  box(scene, "hunt-foundation", mats.stone, cx, y - 0.02, cz, w + 0.35, 0.28, d + 0.3);
  box(scene, "hunt-wall-s", mats.plankDark, cx, y + 1.15, HUNT.minZ + 0.12, w, 2.15, 0.24);
  box(scene, "hunt-wall-n", mats.plankDark, cx, y + 1.15, HUNT.maxZ - 0.12, w, 2.15, 0.24);
  box(scene, "hunt-wall-e", mats.plankDark, HUNT.maxX - 0.12, y + 1.15, cz, 0.24, 2.15, d);
  box(scene, "hunt-wall-w-s", mats.plankDark, HUNT.minX + 0.12, y + 1.15, 162.7, 0.24, 2.15, 1.4);
  box(scene, "hunt-wall-w-n", mats.plankDark, HUNT.minX + 0.12, y + 1.15, 165.4, 0.24, 2.15, 1.6);
  for (const [x, z] of [
    [HUNT.minX, HUNT.minZ],
    [HUNT.maxX, HUNT.minZ],
    [HUNT.minX, HUNT.maxZ],
    [HUNT.maxX, HUNT.maxZ],
  ] as const) {
    post(scene, mats.bark, x, y + 1.2, z, 2.45, 0.2);
  }
  box(scene, "hunt-moss", mats.stone, cx, y + 0.18, HUNT.minZ + 0.26, w * 0.8, 0.22, 0.05);
  const moss = scene.getMeshByName("hunt-moss");
  if (moss?.material instanceof PBRMaterial) moss.material.albedoColor.set(0.38, 0.46, 0.34);

  const longSide = MeshBuilder.CreateBox("hunt-roof-w", { width: 3.6, height: 0.1, depth: d + 0.85 }, scene);
  longSide.position.set(cx - 0.55, y + 2.32, cz);
  longSide.rotation.z = 0.32;
  longSide.material = mats.roof;
  const shortSide = MeshBuilder.CreateBox("hunt-roof-e", { width: 3.2, height: 0.1, depth: d + 0.7 }, scene);
  shortSide.position.set(cx + 0.7, y + 2.28, cz);
  shortSide.rotation.z = -0.26;
  shortSide.material = mats.roof;
  gable(scene, "hunt-gable-s", mats.plankDark, cx, y + 2.2, HUNT.minZ + 0.2, w - 0.2, 0.85, true);
  gable(scene, "hunt-gable-n", mats.plankDark, cx, y + 2.2, HUNT.maxZ - 0.2, w - 0.2, 0.85, true);
  box(scene, "hunt-loose-board", mats.plankDark, 162.4, y + 2.15, 165.6, 0.9, 0.06, 0.16, 0.4);

  boardedWindow(scene, mats.plankDark, cx, y + 1.25, HUNT.minZ + 0.02);
  const glass = new PBRMaterial("hunt-glass", scene);
  glass.albedoColor = Color3.FromHexString("#8d9a90");
  glass.alpha = 0.45;
  glass.roughness = 0.4;
  const pane = MeshBuilder.CreatePlane("hunt-window", { width: 0.7, height: 0.55 }, scene);
  pane.position.set(HUNT.maxX - 0.02, y + 1.35, cz + 0.4);
  pane.rotation.y = Math.PI / 2;
  pane.material = glass;
  box(scene, "hunt-win-frame", mats.bark, HUNT.maxX - 0.04, y + 1.35, cz + 0.4, 0.06, 0.7, 0.86);

  box(scene, "hunt-step", mats.stone, HUNT.minX - 0.45, y + 0.06, 164, 0.7, 0.12, 1.3);
  const door = hingedDoor(scene, mats.plankDark, mats.metal, HUNT.minX + 0.12, y, 163.4, 0.1, 2.0, 1.2);

  box(scene, "hunt-floor", mats.floor, cx, y + 0.16, cz, w - 0.55, 0.08, d - 0.55);
  box(scene, "hunt-ceiling", mats.plankDark, cx, y + 2.12, cz, w - 0.55, 0.05, d - 0.55);
  box(scene, "hunt-bunk", mats.plankDark, 161.6, y + 0.28, 163.05, 1.45, 0.16, 1.15);
  box(scene, "hunt-blanket", mats.cloth, 161.6, y + 0.4, 163.05, 1.3, 0.1, 1.0);
  box(scene, "hunt-table", mats.bark, 158.7, y + 0.48, 165.4, 1.15, 0.08, 0.7);
  box(scene, "hunt-table-leg", mats.bark, 158.7, y + 0.24, 165.4, 0.08, 0.42, 0.08);
  box(scene, "hunt-crate", mats.plank, 161.7, y + 0.28, 165.45, 0.7, 0.5, 0.55);
  box(scene, "hunt-cup", mats.metal, 158.95, y + 0.58, 165.25, 0.1, 0.1, 0.1);
  box(scene, "hunt-paper", mats.paper, 158.4, y + 0.54, 165.55, 0.22, 0.01, 0.16);
  return door;
}

function boardedWindow(scene: Scene, wood: PBRMaterial, x: number, y: number, z: number): void {
  box(scene, "hunt-board-a", wood, x - 0.15, y, z, 0.9, 0.1, 0.05, 0.15);
  box(scene, "hunt-board-b", wood, x + 0.1, y + 0.16, z, 0.85, 0.08, 0.05, -0.2);
  box(scene, "hunt-board-c", wood, x, y - 0.18, z, 0.8, 0.08, 0.05);
}
