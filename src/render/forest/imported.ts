import "@babylonjs/loaders/glTF/2.0";
import { Mesh, PBRMaterial, Quaternion, Scene, SceneLoader, VertexBuffer } from "@babylonjs/core";

export interface SpeciesMeshes {
  near: Mesh[];
  mid: Mesh[];
  far: Mesh[];
}

export interface ImportedForest {
  fir: SpeciesMeshes;
  pine: SpeciesMeshes;
  snag: SpeciesMeshes;
  shadows: Mesh[];
}

const FILES = {
  fir: ["fir-tree.glb", "fir-mid.glb", "fir-far.glb"],
  pine: ["pine-tree.glb", "pine-mid.glb", "pine-far.glb"],
} as const;

function isBark(mesh: Mesh): boolean {
  return mesh.material instanceof PBRMaterial && mesh.material.name.toLowerCase().includes("bark");
}

function configure(mesh: Mesh): void {
  mesh.isPickable = false;
  mesh.alwaysSelectAsActiveMesh = false;
  mesh.receiveShadows = isBark(mesh);
  const material = mesh.material;
  if (!(material instanceof PBRMaterial)) return;
  const name = material.name.toLowerCase();
  if (!name.includes("twig") && !name.includes("leaf")) return;
  material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
  material.useAlphaFromAlbedoTexture = true;
  material.alphaCutOff = 0.28;
  material.backFaceCulling = false;
  material.twoSidedLighting = true;
}

async function loadFile(scene: Scene, file: string): Promise<Mesh[]> {
  const result = await SceneLoader.ImportMeshAsync("", "/models/", file, scene);
  const meshes = result.meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh && mesh.getTotalVertices() > 0);
  for (const mesh of meshes) {
    mesh.setParent(null);
    mesh.position.setAll(0);
    mesh.scaling.setAll(1);
    mesh.rotationQuaternion = Quaternion.Identity();
    configure(mesh);
  }
  for (const node of result.transformNodes) node.dispose();
  return meshes;
}

function measure(meshes: readonly Mesh[]): { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } {
  const box = { minX: Infinity, minY: Infinity, minZ: Infinity, maxX: -Infinity, maxY: -Infinity, maxZ: -Infinity };
  const bark = meshes.filter(isBark);
  const vertical = meshes.length ? meshes : bark;
  const horizontal = bark.length ? bark : meshes;
  for (const mesh of vertical) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    if (!positions) continue;
    for (let i = 1; i < positions.length; i += 3) {
      const y = positions[i] ?? 0;
      if (y < box.minY) box.minY = y;
      if (y > box.maxY) box.maxY = y;
    }
  }
  for (const mesh of horizontal) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    if (!positions) continue;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] ?? 0;
      const z = positions[i + 2] ?? 0;
      if (x < box.minX) box.minX = x;
      if (x > box.maxX) box.maxX = x;
      if (z < box.minZ) box.minZ = z;
      if (z > box.maxZ) box.maxZ = z;
    }
  }
  return box;
}

function seatTransform(meshes: readonly Mesh[], height: number): { scale: number; shiftX: number; shiftY: number; shiftZ: number } {
  const box = measure(meshes);
  const span = Math.max(0.01, box.maxY - box.minY);
  return {
    scale: height / span,
    shiftX: -((box.minX + box.maxX) / 2),
    shiftY: -box.minY,
    shiftZ: -((box.minZ + box.maxZ) / 2),
  };
}

function applySeat(meshes: readonly Mesh[], transform: { scale: number; shiftX: number; shiftY: number; shiftZ: number }): void {
  for (const mesh of meshes) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    if (!positions) continue;
    const next = positions.slice();
    for (let i = 0; i < next.length; i += 3) {
      next[i] = ((next[i] ?? 0) + transform.shiftX) * transform.scale;
      next[i + 1] = ((next[i + 1] ?? 0) + transform.shiftY) * transform.scale;
      next[i + 2] = ((next[i + 2] ?? 0) + transform.shiftZ) * transform.scale;
    }
    mesh.setVerticesData(VertexBuffer.PositionKind, next);
    mesh.refreshBoundingInfo();
  }
}

function fillCrown(mesh: Mesh, grow: number): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  const indices = mesh.getIndices();
  if (!positions || !indices) return;
  const next = Float32Array.from(positions);
  for (let card = 0; card + 5 < indices.length; card += 6) {
    const ids = [indices[card], indices[card + 1], indices[card + 2], indices[card + 3], indices[card + 4], indices[card + 5]].filter(
      (id): id is number => id !== undefined,
    );
    const unique = [...new Set(ids)];
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (const id of unique) {
      cx += next[id * 3] ?? 0;
      cy += next[id * 3 + 1] ?? 0;
      cz += next[id * 3 + 2] ?? 0;
    }
    const count = unique.length || 1;
    cx /= count;
    cy /= count;
    cz /= count;
    for (const id of unique) {
      next[id * 3] = cx + ((next[id * 3] ?? 0) - cx) * grow;
      next[id * 3 + 1] = cy + ((next[id * 3 + 1] ?? 0) - cy) * grow;
      next[id * 3 + 2] = cz + ((next[id * 3 + 2] ?? 0) - cz) * grow;
    }
  }
  mesh.setVerticesData(VertexBuffer.PositionKind, next);
  mesh.refreshBoundingInfo();
}

function shareMaterials(source: readonly Mesh[], target: readonly Mesh[]): void {
  for (const mesh of target) {
    const name = mesh.material?.name.toLowerCase() ?? "";
    const donor = source.find((item) => (item.material?.name.toLowerCase() ?? "") === name);
    const previous = mesh.material;
    if (!donor?.material || donor.material === previous) continue;
    mesh.material = donor.material;
    previous?.dispose(true, true);
  }
}

function barkOnly(source: SpeciesMeshes, label: string): SpeciesMeshes {
  const clone = (mesh: Mesh, name: string) => {
    const copy = mesh.clone(name, null, true);
    if (!copy) throw new Error(`Could not clone ${name}`);
    configure(copy);
    return copy;
  };
  return {
    near: source.near.filter(isBark).map((mesh, index) => clone(mesh, `${label}-near-${index}`)),
    mid: source.mid.filter(isBark).map((mesh, index) => clone(mesh, `${label}-mid-${index}`)),
    far: source.far.filter(isBark).map((mesh, index) => clone(mesh, `${label}-far-${index}`)),
  };
}

function dressDebris(scene: Scene, bark: Mesh): void {
  const texture = bark.material instanceof PBRMaterial ? bark.material.albedoTexture : null;
  if (!texture) return;
  for (const name of ["fallen-log", "root", "stick"]) {
    const mesh = scene.getMeshByName(name);
    if (mesh?.material instanceof PBRMaterial) mesh.material.albedoTexture = texture;
  }
}

async function loadSpecies(scene: Scene, files: readonly [string, string, string], height: number): Promise<SpeciesMeshes> {
  const near = await loadFile(scene, files[0]);
  const mid = await loadFile(scene, files[1]);
  const far = await loadFile(scene, files[2]);
  const transform = seatTransform(near, height);
  applySeat(near, transform);
  applySeat(mid, transform);
  applySeat(far, transform);
  shareMaterials(near, mid);
  shareMaterials(near, far);
  return { near, mid, far };
}

/** Load the reduced fir and pine once. Snags reuse the fir trunk without a crown. */
export async function loadImportedForest(scene: Scene): Promise<ImportedForest> {
  const fir = await loadSpecies(scene, FILES.fir, 9.2);
  const pine = await loadSpecies(scene, FILES.pine, 11);
  for (const mesh of fir.near) {
    if (!isBark(mesh)) fillCrown(mesh, 1.22);
  }
  for (const mesh of pine.near) {
    if (!isBark(mesh)) fillCrown(mesh, 1.75);
  }
  const snag = barkOnly(fir, "snag");
  const bark = fir.near.find(isBark);
  if (bark) dressDebris(scene, bark);
  const shadows = [...fir.near, ...pine.near, ...snag.near].filter(isBark);
  return { fir, pine, snag, shadows };
}
