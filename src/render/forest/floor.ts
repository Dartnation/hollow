import { DynamicTexture, MeshBuilder, Scene, VertexBuffer } from "@babylonjs/core";
import { BRIDGE_ROUTE, ESCAPE_ROUTE, SLOPE_ROUTE, WORLD } from "../../sim/layout";
import { distanceToPolyline } from "../../sim/rng";
import { streamDistance, terrainHeight } from "../../sim/world";
import { pbr } from "../materials";

function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function buildForestFloor(scene: Scene): void {
  const width = WORLD.maxX - WORLD.minX;
  const depth = WORLD.maxZ - WORLD.minZ;
  const ground = MeshBuilder.CreateGround("forest-floor", { width, height: depth, subdivisions: 96, updatable: true }, scene);
  ground.position.set((WORLD.minX + WORLD.maxX) / 2, 0, (WORLD.minZ + WORLD.maxZ) / 2);
  const positions = ground.getVerticesData(VertexBuffer.PositionKind);
  if (positions) {
    for (let i = 0; i < positions.length; i += 3) {
      const x = (positions[i] ?? 0) + ground.position.x;
      const z = (positions[i + 2] ?? 0) + ground.position.z;
      if (positions[i + 1] === undefined) continue;
      positions[i + 1] = terrainHeight(x, z);
    }
    ground.updateVerticesData(VertexBuffer.PositionKind, positions);
    ground.createNormals(true);
  }
  ground.refreshBoundingInfo();
  const material = pbr(scene, "ground", "#3a342c", 0.94, 0);
  material.albedoTexture = paintFloor(scene, 1024);
  material.bumpTexture = paintBump(scene, 512);
  material.useParallax = false;
  ground.material = material;
  ground.receiveShadows = true;
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
      let r = 86 + n * 28;
      let g = 72 + n * 18;
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
      if (path < 3.4) {
        const t = 1 - path / 3.4;
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
      if (hash(wx * 1.7, wz * 1.7) > 0.72 && path > 2) {
        g += 16;
        r -= 6;
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
