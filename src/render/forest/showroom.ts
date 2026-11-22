import "@babylonjs/loaders/glTF/2.0";
import {
  DynamicTexture,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core";
import { groundHeight } from "../../sim/world";
import { pbr } from "../materials";
import { MeshAccum } from "./mesh";
import { bakeSampleFern } from "./samples";
import { buildTreePrototypes } from "./trees";
import { paintFern, paintGroundDetail, paintSampleGround } from "./textures";

/** World positions for the isolated comparison. Left is V2.1S, right is the sample. */
export const SHOWROOM = {
  oldSpruce: { x: -4.2, z: 8 },
  newSpruce: { x: 4.2, z: 8 },
  oldPine: { x: -4.2, z: 15 },
  newPine: { x: 4.2, z: 15 },
  oldFern: { x: -6.4, z: 4.4 },
  newFern: { x: 6.4, z: 4.4 },
  othonna: { x: -1.6, z: 1.4 },
  searsia: { x: 2.8, z: 3.2 },
  jacaranda: { x: 11, z: 12 },
  oldGround: { x: -3.4, z: -0.4 },
  newGround: { x: 3.4, z: -0.4 },
  front: { x: 0, z: -6, lookX: 0, lookZ: 10, pitch: 0.12 },
  spruce: { x: 4.2, z: 3.2, lookX: 4.2, lookZ: 8, pitch: 0.48 },
  spruceSide: { x: 9.2, z: 8, lookX: 4.2, lookZ: 8, pitch: 0.2 },
  pine: { x: 4.2, z: 10.4, lookX: 4.2, lookZ: 15, pitch: 0.42 },
  fern: { x: 6.4, z: 1.2, lookX: 6.4, lookZ: 4.4, pitch: -0.28 },
} as const;

const studioY = () => groundHeight(0, 4);

function stand(mesh: Mesh | null, x: number, z: number): void {
  if (!mesh) return;
  mesh.position.set(x, studioY(), z);
  mesh.isPickable = false;
  mesh.alwaysSelectAsActiveMesh = false;
}

function label(scene: Scene, text: string, x: number, z: number): void {
  const texture = new DynamicTexture(`showroom-${text}`, { width: 512, height: 96 }, scene, true);
  texture.hasAlpha = true;
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, 512, 96);
  ctx.fillStyle = "#241c16";
  ctx.fillRect(8, 8, 496, 80);
  ctx.fillStyle = "#f3ecdf";
  ctx.font = "44px sans-serif";
  ctx.fillText(text, 28, 64);
  texture.update();
  const plane = MeshBuilder.CreatePlane(`showroom-label-${text}`, { width: 1.8, height: 0.36 }, scene);
  plane.position.set(x, studioY() + 0.35, z);
  plane.billboardMode = Mesh.BILLBOARDMODE_Y;
  const material = new StandardMaterial(`showroom-label-mat-${text}`, scene);
  material.diffuseTexture = texture;
  material.emissiveTexture = texture;
  material.backFaceCulling = false;
  material.disableLighting = true;
  plane.material = material;
  plane.isPickable = false;
}

function legacyFern(scene: Scene): Mesh {
  const accum = new MeshAccum();
  const up = new Vector3(0.05, 0.82, 0.35).normalize();
  accum.addCard(new Vector3(0, 0.32, 0.12), Vector3.Right(), up, 0.62, 0.78);
  return accum.bake("showroom-old-fern", scene);
}

function groundPatch(scene: Scene, name: string, x: number, z: number, detailed: boolean): void {
  const mesh = MeshBuilder.CreateGround(name, { width: 4.2, height: 4.2, subdivisions: detailed ? 24 : 4, updatable: detailed }, scene);
  mesh.position.set(x, studioY() + 0.03, z);
  if (detailed) {
    const positions = mesh.getVerticesData("position");
    if (positions) {
      for (let i = 1; i < positions.length; i += 3) {
        const px = positions[i - 1] ?? 0;
        const pz = positions[i + 1] ?? 0;
        positions[i] = Math.sin(px * 3.1 + pz * 2.4) * 0.035;
      }
      mesh.updateVerticesData("position", positions);
      mesh.createNormals(true);
    }
  }
  const material = pbr(scene, `${name}-mat`, "#f2ebe3", 0.94, 0);
  material.albedoTexture = detailed ? paintSampleGround(scene) : paintGroundDetail(scene);
  if (detailed && material.albedoTexture instanceof Texture) {
    material.albedoTexture.uScale = 2;
    material.albedoTexture.vScale = 2;
  }
  mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = true;
}

async function placeReducedTree(scene: Scene, file: string, x: number, z: number, height: number): Promise<void> {
  const result = await SceneLoader.ImportMeshAsync("", "/models/", file, scene);
  const meshes = result.meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh && mesh.getTotalVertices() > 0);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const mesh of meshes) {
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    if (!positions) continue;
    for (let i = 1; i < positions.length; i += 3) {
      const y = positions[i] ?? 0;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    mesh.isPickable = false;
    const material = mesh.material;
    const materialName = material instanceof PBRMaterial ? material.name.toLowerCase() : "";
    if (material instanceof PBRMaterial && (materialName.includes("twig") || materialName.includes("leaf") || materialName.includes("canopy"))) {
      material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
      material.useAlphaFromAlbedoTexture = true;
      material.alphaCutOff = materialName.includes("canopy") ? 0.2 : 0.42;
      material.backFaceCulling = false;
      material.twoSidedLighting = true;
    }
  }
  const root = new TransformNode(file, scene);
  const imported = result.transformNodes.find((node) => node.name === "__root__") ?? result.transformNodes[0];
  if (imported) imported.parent = root;
  else {
    for (const mesh of meshes) mesh.parent = root;
  }
  const span = Math.max(0.01, maxY - minY);
  const scale = height > 0 ? height / span : 1;
  root.scaling.setAll(scale);
  root.position.set(x, studioY() - minY * scale, z);
}

export async function buildShowroom(scene: Scene): Promise<void> {
  const deck = MeshBuilder.CreateGround("showroom-deck", { width: 40, height: 28 }, scene);
  deck.position.set(0, studioY() - 0.04, 5);
  deck.material = pbr(scene, "showroom-deck", "#b7b1a8", 0.92, 0);
  deck.isPickable = false;
  const prototypes = buildTreePrototypes(scene);
  for (const proto of prototypes) {
    proto.bark.setEnabled(false);
    proto.foliage?.setEnabled(false);
    proto.spine.setEnabled(false);
    proto.mid?.setEnabled(false);
    proto.far?.setEnabled(false);
  }
  const spruce = prototypes[0];
  const pine = prototypes[3];
  if (spruce) {
    spruce.bark.setEnabled(true);
    spruce.foliage?.setEnabled(true);
    stand(spruce.bark, SHOWROOM.oldSpruce.x, SHOWROOM.oldSpruce.z);
    stand(spruce.foliage, SHOWROOM.oldSpruce.x, SHOWROOM.oldSpruce.z);
  }
  if (pine) {
    pine.bark.setEnabled(true);
    pine.foliage?.setEnabled(true);
    stand(pine.bark, SHOWROOM.oldPine.x, SHOWROOM.oldPine.z);
    stand(pine.foliage, SHOWROOM.oldPine.x, SHOWROOM.oldPine.z);
  }

  const fernTex = paintFern(scene);
  const sampleFern = bakeSampleFern(scene, fernTex);
  sampleFern.bark.material = pbr(scene, "showroom-fern-bark", "#4a3b2e", 0.94, 0);
  stand(sampleFern.bark, SHOWROOM.newFern.x, SHOWROOM.newFern.z);
  stand(sampleFern.foliage, SHOWROOM.newFern.x, SHOWROOM.newFern.z);

  const oldFern = legacyFern(scene);
  const oldFernMat = pbr(scene, "showroom-old-fern-mat", "#e4ebe4", 0.9, 0);
  oldFernMat.useAlphaFromAlbedoTexture = true;
  oldFernMat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
  oldFernMat.alphaCutOff = 0.3;
  oldFernMat.backFaceCulling = false;
  oldFernMat.albedoTexture = fernTex;
  oldFern.material = oldFernMat;
  stand(oldFern, SHOWROOM.oldFern.x, SHOWROOM.oldFern.z);

  groundPatch(scene, "showroom-old-ground", SHOWROOM.oldGround.x, SHOWROOM.oldGround.z, false);
  groundPatch(scene, "showroom-new-ground", SHOWROOM.newGround.x, SHOWROOM.newGround.z, true);

  label(scene, "V2.1S gran", SHOWROOM.oldSpruce.x, SHOWROOM.oldSpruce.z - 1.6);
  label(scene, "Poly Haven gran", SHOWROOM.newSpruce.x, SHOWROOM.newSpruce.z - 1.6);
  label(scene, "V2.1S fyr", SHOWROOM.oldPine.x, SHOWROOM.oldPine.z - 1.6);
  label(scene, "Poly Haven fyr", SHOWROOM.newPine.x, SHOWROOM.newPine.z - 1.6);
  await placeReducedTree(scene, "fir-tree.glb", SHOWROOM.newSpruce.x, SHOWROOM.newSpruce.z, 9.2);
  await placeReducedTree(scene, "pine-tree.glb", SHOWROOM.newPine.x, SHOWROOM.newPine.z, 11);
  await placeReducedTree(scene, "othonna.glb", SHOWROOM.othonna.x, SHOWROOM.othonna.z, 0);
  await placeReducedTree(scene, "searsia.glb", SHOWROOM.searsia.x, SHOWROOM.searsia.z, 0);
  await placeReducedTree(scene, "jacaranda.glb", SHOWROOM.jacaranda.x, SHOWROOM.jacaranda.z, 8);
  label(scene, "Othonna", SHOWROOM.othonna.x, SHOWROOM.othonna.z - 0.7);
  label(scene, "Searsia", SHOWROOM.searsia.x, SHOWROOM.searsia.z - 0.9);
  label(scene, "Jacaranda", SHOWROOM.jacaranda.x, SHOWROOM.jacaranda.z - 1.4);
  label(scene, "V2.1S bregne", SHOWROOM.oldFern.x, SHOWROOM.oldFern.z - 0.8);
  label(scene, "Prøve bregne", SHOWROOM.newFern.x, SHOWROOM.newFern.z - 0.8);
}
