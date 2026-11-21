import { DynamicTexture, Mesh, MeshBuilder, Scene, Texture, VertexBuffer } from "@babylonjs/core";
import { BRIDGE_ROUTE, ESCAPE_ROUTE, SLOPE_ROUTE, WORLD } from "../../sim/layout";
import { distanceToPolyline } from "../../sim/rng";
import { backgroundPlaneY, lowestTerrain } from "../../sim/terrainBounds";
import { streamDistance, terrainHeight } from "../../sim/world";
import { pbr } from "../materials";
import { paintGroundDetail } from "./textures";

function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function buildForestFloor(scene: Scene): void {
  const width = WORLD.maxX - WORLD.minX;
  const depth = WORLD.maxZ - WORLD.minZ;
  const ground = MeshBuilder.CreateGround("forest-floor", { width, height: depth, subdivisions: 96, updatable: true }, scene);
  ground.position.set((WORLD.minX + WORLD.maxX) / 2, 0, (WORLD.minZ + WORLD.maxZ) / 2);
  displaceToTerrain(ground);
  const material = pbr(scene, "ground", "#f0ebe4", 0.94, 0);
  const albedo = paintFloor(scene, 1024);
  albedo.wrapU = Texture.CLAMP_ADDRESSMODE;
  albedo.wrapV = Texture.CLAMP_ADDRESSMODE;
  material.albedoTexture = albedo;
  material.bumpTexture = paintBump(scene, 512);
  const detail = paintGroundDetail(scene);
  detail.uScale = width / 3.2;
  detail.vScale = depth / 3.2;
  material.detailMap.isEnabled = true;
  material.detailMap.texture = detail;
  material.detailMap.diffuseBlendLevel = 0.42;
  material.detailMap.bumpLevel = 0;
  material.useParallax = false;
  ground.material = material;
  ground.receiveShadows = true;

  const reach = 48;
  const midX = (WORLD.minX + WORLD.maxX) / 2;
  const midZ = (WORLD.minZ + WORLD.maxZ) / 2;
  const bands = [
    { name: "west", x: WORLD.minX - reach / 2, z: midZ, w: reach, d: depth + reach * 2 },
    { name: "east", x: WORLD.maxX + reach / 2, z: midZ, w: reach, d: depth + reach * 2 },
    { name: "south", x: midX, z: WORLD.minZ - reach / 2, w: width, d: reach },
    { name: "north", x: midX, z: WORLD.maxZ + reach / 2, w: width, d: reach },
  ];
  const marginMat = pbr(scene, "ground-margin", "#d9cfc2", 0.96, 0);
  marginMat.albedoTexture = detail;
  marginMat.bumpTexture = material.bumpTexture;
  for (const band of bands) {
    const margin = MeshBuilder.CreateGround(`forest-margin-${band.name}`, { width: band.w, height: band.d, subdivisions: 12, updatable: true }, scene);
    margin.position.set(band.x, 0, band.z);
    displaceToTerrain(margin);
    margin.material = marginMat;
    margin.receiveShadows = true;
    margin.isPickable = false;
  }

  const skirt = MeshBuilder.CreateGround("forest-skirt", { width: width + reach * 2 + 80, height: depth + reach * 2 + 80 }, scene);
  skirt.position.set(midX, backgroundPlaneY(lowestTerrain()), midZ);
  const skirtMat = pbr(scene, "forest-skirt", "#101412", 1, 0);
  skirtMat.environmentIntensity = 0;
  skirtMat.directIntensity = 0.2;
  skirt.material = skirtMat;
  skirt.isPickable = false;
  skirt.receiveShadows = false;
}

function displaceToTerrain(mesh: Mesh): void {
  const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
  if (!positions) return;
  for (let i = 0; i < positions.length; i += 3) {
    const x = (positions[i] ?? 0) + mesh.position.x;
    const z = (positions[i + 2] ?? 0) + mesh.position.z;
    if (positions[i + 1] === undefined) continue;
    positions[i + 1] = terrainHeight(x, z);
  }
  mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
  mesh.createNormals(true);
  mesh.refreshBoundingInfo();
}

function paintFloor(scene: Scene, size: number): DynamicTexture {
  const texture = new DynamicTexture("forest-floor-albedo", { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  const width = WORLD.maxX - WORLD.minX;
  const depth = WORLD.maxZ - WORLD.minZ;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const wx = WORLD.minX + (x / size) * width;
      const wz = WORLD.minZ + (1 - y / size) * depth;
      const n = hash(wx * 0.37, wz * 0.37);
      const h = terrainHeight(wx, wz);
      let r = 78 + n * 24;
      let g = 68 + n * 16;
      let b = 52 + n * 12;
      if (h > 2.2) {
        g += 18;
        r -= 8;
      }
      const path = Math.min(
        distanceToPolyline(wx, wz, BRIDGE_ROUTE),
        distanceToPolyline(wx, wz, SLOPE_ROUTE),
        distanceToPolyline(wx, wz, ESCAPE_ROUTE),
      );
      if (path < 1.6) {
        const t = 1 - path / 1.6;
        r = r * (1 - t) + 112 * t;
        g = g * (1 - t) + 90 * t;
        b = b * (1 - t) + 68 * t;
      }
      if (distanceToPolyline(wx, wz, SLOPE_ROUTE) < 8 && h > 1) {
        r *= 0.82;
        g *= 0.9;
      }
      const wet = streamDistance(wx, wz);
      if (wet < 8) {
        const t = 1 - wet / 8;
        r = r * (1 - t) + 28 * t;
        g = g * (1 - t) + 42 * t;
        b = b * (1 - t) + 46 * t;
      }
      if (hash(wx * 1.7, wz * 1.7) > 0.52 && path > 1.15) {
        g += 10;
        r -= 4;
      }
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  return texture;
}

function paintBump(scene: Scene, size: number): DynamicTexture {
  const texture = new DynamicTexture("forest-floor-bump", { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      height[y * size + x] = hash(x * 0.73, y * 0.61);
    }
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const hL = height[y * size + ((x + size - 1) % size)] ?? 0;
      const hR = height[y * size + ((x + 1) % size)] ?? 0;
      const hD = height[((y + size - 1) % size) * size + x] ?? 0;
      const hU = height[((y + 1) % size) * size + x] ?? 0;
      const dx = (hL - hR) * 2.2;
      const dy = (hD - hU) * 2.2;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = ((dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = (1 / len) * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  return texture;
}
