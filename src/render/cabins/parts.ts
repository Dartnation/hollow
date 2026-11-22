import { Mesh, MeshBuilder, VertexData, type PBRMaterial, type Scene } from "@babylonjs/core";

export function box(
  scene: Scene,
  name: string,
  material: PBRMaterial,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rotY = 0,
): void {
  const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.material = material;
  mesh.receiveShadows = true;
}

/** A vertical triangle that closes the opening under a pitched roof. */
export function gable(scene: Scene, name: string, material: PBRMaterial, x: number, y: number, z: number, width: number, height: number, alongX: boolean): void {
  const mesh = new Mesh(name, scene);
  const front = alongX
    ? [-width / 2, 0, 0, width / 2, 0, 0, 0, height, 0]
    : [0, 0, -width / 2, 0, 0, width / 2, 0, height, 0];
  const normal = alongX ? [0, 0, 1, 0, 0, 1, 0, 0, 1] : [1, 0, 0, 1, 0, 0, 1, 0, 0];
  const backNormal = normal.map((value) => -value);
  const data = new VertexData();
  data.positions = [...front, ...front];
  data.indices = [0, 1, 2, 5, 4, 3];
  data.uvs = [0, 0, 1, 0, 0.5, 1, 0, 0, 1, 0, 0.5, 1];
  data.normals = [...normal, ...backNormal];
  data.applyToMesh(mesh);
  mesh.position.set(x, y, z);
  mesh.material = material;
  mesh.receiveShadows = true;
}

export function post(scene: Scene, material: PBRMaterial, x: number, y: number, z: number, height: number, diameter = 0.18): void {
  const mesh = MeshBuilder.CreateCylinder(`post-${x}-${z}`, { height, diameter, tessellation: 8 }, scene);
  mesh.position.set(x, y, z);
  mesh.material = material;
  mesh.receiveShadows = true;
}
