import { MeshBuilder, PBRMaterial, type Scene, type TransformNode } from "@babylonjs/core";
import { INTERACT } from "../../sim/layout";
import { hingedDoor } from "./door";
import { box, gable, post } from "./parts";
import { cabinMaterials } from "./textures";

/** The mission cabin, on the same footprint and the same door pivots. */
export function buildRanger(
  scene: Scene,
  floorY: number,
  glass: PBRMaterial,
  diodeMat: PBRMaterial,
): { front: TransformNode; side: TransformNode } {
  const mats = cabinMaterials(scene);
  const y = floorY;
  box(scene, "wall-foundation", mats.stone, 110.5, y - 0.04, 145, 9.7, 0.24, 8.7);
  box(scene, "wall-s-l", mats.plank, 107.5, y + 1.48, 141.02, 3, 2.78, 0.28);
  box(scene, "wall-s-r", mats.plank, 113, y + 1.48, 141.02, 4, 2.78, 0.28);
  box(scene, "wall-n", mats.plank, 110.5, y + 1.48, 149, 9.15, 2.78, 0.28);
  box(scene, "wall-w", mats.plank, 106.16, y + 1.48, 145, 0.28, 2.78, 8);
  box(scene, "wall-e-s", mats.plank, 115, y + 1.48, 142.5, 0.28, 2.78, 3);
  box(scene, "wall-e-n", mats.plank, 115, y + 1.48, 147.5, 0.28, 2.78, 3);
  for (const [x, z] of [
    [106.15, 141.1],
    [114.9, 141.1],
    [106.15, 148.9],
    [114.9, 148.9],
  ] as const) {
    post(scene, mats.plankDark, x, y + 1.55, z, 3.15, 0.22);
  }
  box(scene, "wall-sill", mats.plankDark, 110.5, y + 2.82, 145, 9.5, 0.16, 8.5);
  gable(scene, "wall-gable-s", mats.plank, 110.5, y + 2.8, 141.02, 9.4, 1.6, true);
  gable(scene, "wall-gable-n", mats.plank, 110.5, y + 2.8, 148.98, 9.4, 1.6, true);
  box(scene, "wall-moss", mats.stone, 110.5, y + 0.22, 141.16, 8.6, 0.28, 0.06);
  const moss = scene.getMeshByName("wall-moss");
  if (moss?.material instanceof PBRMaterial) moss.material.albedoColor.set(0.45, 0.52, 0.4);

  windowFrame(scene, mats.plankDark, glass, 112.9, y + 1.65, 140.88, 1.55, 1.12, false);
  windowFrame(scene, mats.plankDark, glass, 106.02, y + 1.65, 146.85, 1.15, 1.12, true);

  const left = MeshBuilder.CreateBox("roof-l", { width: 5.7, height: 0.14, depth: 10.4 }, scene);
  left.position.set(108.05, y + 3.62, 145);
  left.rotation.z = 0.46;
  left.material = mats.roof;
  const right = MeshBuilder.CreateBox("roof-r", { width: 5.7, height: 0.14, depth: 10.4 }, scene);
  right.position.set(112.95, y + 3.62, 145);
  right.rotation.z = -0.46;
  right.material = mats.roof;
  box(scene, "wall-ridge", mats.plankDark, 110.5, y + 4.15, 145, 0.18, 0.18, 10.2);
  box(scene, "chimney", mats.stone, 113.4, y + 4.2, 147.2, 0.55, 1.45, 0.55);
  box(scene, "chimney-cap", mats.stone, 113.4, y + 4.95, 147.2, 0.7, 0.1, 0.7);

  porch(scene, mats, y);
  const front = hingedDoor(scene, mats.plankDark, mats.metal, 109, y, 141.05, 2, 2.35, 0.08);
  const side = hingedDoor(scene, mats.plankDark, mats.metal, 115.02, y, 144, 0.12, 2.2, 2);
  interior(scene, mats, glass, diodeMat, y);
  return { front, side };
}

function windowFrame(
  scene: Scene,
  wood: PBRMaterial,
  glass: PBRMaterial,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  side: boolean,
): void {
  const pane = MeshBuilder.CreatePlane(`window-${x}`, { width: w * 0.82, height: h * 0.78 }, scene);
  pane.position.set(x, y, z);
  if (side) pane.rotation.y = Math.PI / 2;
  pane.material = glass;
  const t = 0.06;
  if (side) {
    box(scene, `win-l-${x}`, wood, x, y, z - w / 2, 0.08, h, t);
    box(scene, `win-r-${x}`, wood, x, y, z + w / 2, 0.08, h, t);
    box(scene, `win-t-${x}`, wood, x, y + h / 2, z, 0.08, t, w);
    box(scene, `win-b-${x}`, wood, x, y - h / 2, z, 0.08, t, w);
    box(scene, `win-m-${x}`, wood, x, y, z, 0.08, t, w);
  } else {
    box(scene, `win-l-${x}`, wood, x - w / 2, y, z, t, h, 0.08);
    box(scene, `win-r-${x}`, wood, x + w / 2, y, z, t, h, 0.08);
    box(scene, `win-t-${x}`, wood, x, y + h / 2, z, w, t, 0.08);
    box(scene, `win-b-${x}`, wood, x, y - h / 2, z, w, t, 0.08);
    box(scene, `win-m-${x}`, wood, x, y, z, w, t, 0.08);
  }
}

function porch(scene: Scene, mats: ReturnType<typeof cabinMaterials>, y: number): void {
  box(scene, "porch", mats.floor, 106.6, y + 0.12, 153.6, 7.2, 0.12, 8.6);
  box(scene, "porch-roof", mats.roof, 106.6, y + 2.55, 153.6, 7.6, 0.1, 9);
  for (const [x, z] of [
    [103.6, 149.6],
    [109.6, 149.6],
    [103.6, 157.6],
    [109.6, 157.6],
  ] as const) {
    post(scene, mats.plankDark, x, y + 1.28, z, 2.45, 0.16);
  }
  box(scene, "porch-rail-w", mats.plankDark, 103.6, y + 0.85, 153.6, 0.06, 0.08, 7.4);
  box(scene, "porch-rail-n", mats.plankDark, 106.6, y + 0.85, 157.6, 5.6, 0.08, 0.06);
  box(scene, "crate-a", mats.plank, 105.35, y + 0.7, 153.9, 1.9, 1.15, 1.4);
  box(scene, "crate-b", mats.plankDark, 107.5, y + 0.75, 156.2, 1.8, 1.25, 1.6);
  box(scene, "crate-band", mats.metal, 105.35, y + 0.95, 153.9, 1.92, 0.04, 1.42);
}

function interior(scene: Scene, mats: ReturnType<typeof cabinMaterials>, glass: PBRMaterial, diodeMat: PBRMaterial, y: number): void {
  box(scene, "floor", mats.floor, 110.5, y + 0.14, 145, 8.55, 0.1, 7.55);
  box(scene, "ceiling", mats.plankDark, 110.5, y + 2.7, 145, 8.4, 0.08, 7.4);
  box(scene, "beam-a", mats.bark, 110.5, y + 2.58, 143.2, 8.1, 0.12, 0.14);
  box(scene, "beam-b", mats.bark, 110.5, y + 2.58, 146.6, 8.1, 0.12, 0.14);

  box(scene, "table", mats.plank, 113.25, y + 0.42, 144, 1.9, 0.08, 0.95);
  for (const [x, z] of [
    [112.45, 143.65],
    [114.05, 143.65],
    [112.45, 144.4],
    [114.05, 144.4],
  ] as const) {
    box(scene, `table-leg-${x}`, mats.plankDark, x, y + 0.22, z, 0.08, 0.4, 0.08);
  }
  box(scene, "radio", mats.metal, INTERACT.radio.x, y + 0.96, INTERACT.radio.z, 0.62, 0.28, 0.34);
  box(scene, "radio-dial", mats.plankDark, INTERACT.radio.x - 0.08, y + 1.02, INTERACT.radio.z + 0.16, 0.16, 0.16, 0.02);
  const diode = MeshBuilder.CreateSphere("diode", { diameter: 0.06, segments: 8 }, scene);
  diode.position.set(INTERACT.radio.x + 0.22, y + 1.08, INTERACT.radio.z + 0.12);
  diode.material = diodeMat;
  box(scene, "notebook", mats.paper, INTERACT.notebook.x, y + 0.9, INTERACT.notebook.z, 0.28, 0.035, 0.36);
  box(scene, "paper-a", mats.paper, 112.55, y + 0.88, 143.85, 0.18, 0.01, 0.24);
  box(scene, "panel", mats.metal, INTERACT.panel.x, y + 1.35, INTERACT.panel.z, 0.08, 0.72, 0.48);
  box(scene, "panel-switch", mats.plankDark, INTERACT.panel.x + 0.05, y + 1.48, INTERACT.panel.z, 0.03, 0.08, 0.08);

  box(scene, "bed-frame", mats.plankDark, 107.7, y + 0.22, 147.3, 2.2, 0.16, 1.2);
  box(scene, "bed", mats.cloth, 107.7, y + 0.4, 147.3, 2.05, 0.22, 1.05);
  box(scene, "pillow", mats.cloth, 106.9, y + 0.52, 147.3, 0.35, 0.12, 0.7);
  box(scene, "stove", mats.metal, 113.55, y + 0.5, 147.45, 0.78, 0.85, 0.68);
  box(scene, "stove-pipe", mats.metal, 113.55, y + 1.45, 147.7, 0.1, 1.1, 0.1);
  box(scene, "shelf", mats.plank, 108.4, y + 1.55, 148.55, 1.6, 0.06, 0.32);
  box(scene, "shelf-jar", glass, 107.9, y + 1.72, 148.55, 0.12, 0.22, 0.12);
  box(scene, "tool", mats.metal, 114.2, y + 0.55, 146.55, 0.06, 0.04, 0.42);
}
