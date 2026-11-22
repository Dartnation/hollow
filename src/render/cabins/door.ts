import { MeshBuilder, TransformNode, type Scene } from "@babylonjs/core";
import type { PBRMaterial } from "@babylonjs/core";

/**
 * Same pivot as the V1 door: the leaf grows in +X when it is wide,
 * and in +Z when it is deep. Extra panels and the handle are children.
 */
export function hingedDoor(
  scene: Scene,
  wood: PBRMaterial,
  metal: PBRMaterial,
  x: number,
  floorY: number,
  z: number,
  width: number,
  height: number,
  depth: number,
): TransformNode {
  const pivot = new TransformNode(`door-pivot-${x}-${z}`, scene);
  pivot.position.set(x, floorY, z);
  const leafW = width > 0.4 ? width : 0.08;
  const leafD = depth > 0.4 ? depth : 0.08;
  const leaf = MeshBuilder.CreateBox(`door-${x}`, { width: leafW, height, depth: leafD }, scene);
  leaf.material = wood;
  leaf.parent = pivot;
  leaf.position.x = width > 0.4 ? width / 2 : 0;
  leaf.position.y = height / 2;
  leaf.position.z = depth > 0.4 ? depth / 2 : 0;

  const panel = (name: string, px: number, py: number, pz: number, w: number, h: number, d: number) => {
    const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    mesh.parent = leaf;
    mesh.position.set(px, py, pz);
    mesh.material = wood;
  };
  if (width > 0.4) {
    panel(`door-panel-a-${x}`, 0, 0.28, 0.02, width * 0.72, height * 0.34, 0.02);
    panel(`door-panel-b-${x}`, 0, -0.32, 0.02, width * 0.72, height * 0.28, 0.02);
  } else {
    panel(`door-panel-a-${x}`, 0.02, 0.28, 0, 0.02, height * 0.34, depth * 0.72);
    panel(`door-panel-b-${x}`, 0.02, -0.32, 0, 0.02, height * 0.28, depth * 0.72);
  }

  const handle = MeshBuilder.CreateCylinder(`handle-${x}`, { height: 0.16, diameter: 0.035, tessellation: 8 }, scene);
  handle.parent = leaf;
  handle.material = metal;
  handle.rotation.z = Math.PI / 2;
  handle.position.y = 0.05;
  if (width > 0.4) handle.position.set(width * 0.32, 0.05, 0.06);
  else handle.position.set(0.07, 0.05, depth * 0.32);
  return pivot;
}
