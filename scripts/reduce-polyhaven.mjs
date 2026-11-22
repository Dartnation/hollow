/**
 * Builds game-ready GLBs from Poly Haven CC0 trees.
 * Source scans stay in .cache/polyhaven (gitignored). The exported files keep the
 * trunk and branches, then replace the millions of needle slivers with a few
 * crossed cards that use the photographed twig atlas.
 *
 *   node scripts/reduce-polyhaven.mjs
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MeshoptSimplifier } from "meshoptimizer";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const JOBS = [
  {
    id: "fir",
    gltf: ".cache/polyhaven/fir_tree_01_1k.gltf",
    bin: ".cache/polyhaven/fir/fir_c.bin",
    fullLength: 478462204,
    sliceStart: 445212268,
    sliceLength: 33249936,
    meshIndex: 2,
    textures: ".cache/polyhaven/fir/textures",
    out: "public/models/fir-tree.glb",
    source: "https://polyhaven.com/a/fir_tree_01",
    lean: 0.38,
    cell: 0.42,
  },
  {
    id: "pine",
    gltf: ".cache/polyhaven/pine_tree_01_1k.gltf",
    bin: ".cache/polyhaven/pine/pine_b.bin",
    fullLength: 948849556,
    sliceStart: 383907976,
    sliceLength: 233090004,
    meshIndex: 1,
    textures: ".cache/polyhaven/pine/textures",
    out: "public/models/pine-tree.glb",
    source: "https://polyhaven.com/a/pine_tree_01",
    lean: 0.3,
    cell: 0.38,
    cardHeight: 1.2,
    cross: 36,
  },
];

const TARGET_TRIS = { bark: 2800, trunk: 1600, dead: 520 };

function resolveBase(size, job) {
  if (size === job.fullLength) return 0;
  if (size === job.sliceLength) return job.sliceStart;
  throw new Error(`${job.id} bin is ${size} bytes, expected ${job.fullLength} or ${job.sliceLength}`);
}

function readAccessor(gltf, bin, base, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0) - base;
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type];
  if (!components) throw new Error(`unsupported accessor type ${accessor.type}`);
  if (accessor.componentType === 5126) {
    const bytes = accessor.count * components * 4;
    const copy = Buffer.alloc(bytes);
    bin.copy(copy, 0, offset, offset + bytes);
    return new Float32Array(copy.buffer, copy.byteOffset, accessor.count * components);
  }
  if (accessor.componentType === 5123 || accessor.componentType === 5125) {
    const width = accessor.componentType === 5123 ? 2 : 4;
    const copy = Buffer.alloc(accessor.count * width);
    bin.copy(copy, 0, offset, offset + accessor.count * width);
    if (accessor.componentType === 5125) return new Uint32Array(copy.buffer, copy.byteOffset, accessor.count);
    const wide = new Uint32Array(accessor.count);
    const narrow = new Uint16Array(copy.buffer, copy.byteOffset, accessor.count);
    for (let i = 0; i < accessor.count; i += 1) wide[i] = narrow[i];
    return wide;
  }
  throw new Error(`unsupported component ${accessor.componentType}`);
}

function textureTransform(material) {
  const texture = material.pbrMetallicRoughness?.baseColorTexture;
  return texture?.extensions?.KHR_texture_transform ?? null;
}

function applyTransform(uv, transform) {
  if (!transform) return uv;
  const offset = transform.offset || [0, 0];
  const scale = transform.scale || [1, 1];
  const out = new Float32Array(uv.length);
  for (let i = 0; i < uv.length; i += 2) {
    out[i] = uv[i] * scale[0] + offset[0];
    out[i + 1] = uv[i + 1] * scale[1] + offset[1];
  }
  return out;
}

function cylindricalUv(positions) {
  const uv = new Float32Array((positions.length / 3) * 2);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    uv[(i / 3) * 2] = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
    uv[(i / 3) * 2 + 1] = y * 0.16;
  }
  return uv;
}

function roleOf(name) {
  const text = name.toLowerCase();
  if (text.includes("twig")) return "twig";
  if (text.includes("dead")) return "dead";
  if (text.includes("trunk")) return "trunk";
  return "bark";
}

async function simplifySolid(indices, positions, uvs, targetTris) {
  await MeshoptSimplifier.ready;
  const target = Math.min(indices.length, targetTris * 3);
  const aligned = target - (target % 3);
  if (indices.length <= aligned) return indices;
  let limit = 0.012;
  let best = indices;
  while (limit <= 0.35) {
    const [out] = MeshoptSimplifier.simplifyWithAttributes(
      indices,
      positions,
      3,
      uvs,
      2,
      [0.35, 0.35],
      null,
      aligned,
      limit,
      ["RegularizeLight"],
    );
    best = out;
    if (out.length <= aligned * 1.15) break;
    limit *= 1.65;
  }
  return best;
}

function compact(indices, positions, uvs) {
  const remap = new Int32Array(positions.length / 3).fill(-1);
  const pos = [];
  const uv = [];
  const idx = [];
  for (let t = 0; t < indices.length; t += 1) {
    const source = indices[t];
    let next = remap[source];
    if (next < 0) {
      next = pos.length / 3;
      remap[source] = next;
      pos.push(positions[source * 3], positions[source * 3 + 1], positions[source * 3 + 2]);
      uv.push(uvs[source * 2], uvs[source * 2 + 1]);
    }
    idx.push(next);
  }
  return { pos: Float32Array.from(pos), uv: Float32Array.from(uv), idx: Uint32Array.from(idx) };
}

function recomputeNormals(idx, pos) {
  const normals = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    const ax = pos[b] - pos[a];
    const ay = pos[b + 1] - pos[a + 1];
    const az = pos[b + 2] - pos[a + 2];
    const bx = pos[c] - pos[a];
    const by = pos[c + 1] - pos[a + 1];
    const bz = pos[c + 2] - pos[a + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    normals[a] += nx;
    normals[a + 1] += ny;
    normals[a + 2] += nz;
    normals[b] += nx;
    normals[b + 1] += ny;
    normals[b + 2] += nz;
    normals[c] += nx;
    normals[c + 1] += ny;
    normals[c + 2] += nz;
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length;
    normals[i + 1] /= length;
    normals[i + 2] /= length;
  }
  return normals;
}

function mergeParts(parts) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (const part of parts) {
    const base = pos.length / 3;
    for (let i = 0; i < part.pos.length; i += 1) pos.push(part.pos[i]);
    for (let i = 0; i < part.uv.length; i += 1) uv.push(part.uv[i]);
    for (let i = 0; i < part.idx.length; i += 1) idx.push(part.idx[i] + base);
  }
  const positions = Float32Array.from(pos);
  const indices = Uint32Array.from(idx);
  return { positions, uvs: Float32Array.from(uv), indices, normals: recomputeNormals(indices, positions) };
}

function alphaValue(data, index) {
  const alpha = data[index + 3];
  if (alpha < 250) return alpha;
  return Math.max(data[index], data[index + 1], data[index + 2]);
}

function findSprigs(png, color) {
  const step = 2;
  const width = Math.ceil(png.width / step);
  const height = Math.ceil(png.height / step);
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * step * png.width + x * step) * 4;
      mask[y * width + x] = png.data[index + 3] > 150 ? 1 : 0;
    }
  }
  const seen = new Uint8Array(mask.length);
  const sprigs = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (!mask[start] || seen[start]) continue;
      const queue = [[x, y]];
      seen[start] = 1;
      let head = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let area = 0;
      while (head < queue.length) {
        const [cx, cy] = queue[head];
        head += 1;
        area += 1;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (!mask[next] || seen[next]) continue;
          seen[next] = 1;
          queue.push([nx, ny]);
        }
      }
      const pixelW = (maxX - minX + 1) * step;
      const pixelH = (maxY - minY + 1) * step;
      const fill = area / ((maxX - minX + 1) * (maxY - minY + 1));
      const u0 = (minX * step) / png.width;
      const u1 = ((maxX + 1) * step) / png.width;
      if (pixelW < 48 || pixelH < 48 || pixelW > 520 || pixelH > 520) continue;
      if (u0 < 0.02 && u1 < 0.12) continue;
      if (fill < 0.04 || fill > 0.55) continue;
      let red = 0;
      let green = 0;
      let blue = 0;
      let samples = 0;
      for (let py = minY * step; py <= maxY * step; py += 4) {
        for (let px = minX * step; px <= maxX * step; px += 4) {
          const index = (py * png.width + px) * 4;
          if (png.data[index + 3] < 160) continue;
          red += color.data[index];
          green += color.data[index + 1];
          blue += color.data[index + 2];
          samples += 1;
        }
      }
      if (samples < 4) continue;
      red /= samples;
      green /= samples;
      blue /= samples;
      if (red > green + 6) continue;
      const pad = 1 / png.width;
      const sprig = {
        u0: u0 + pad,
        u1: u1 - pad,
        v0: 1 - ((maxY + 1) * step) / png.height + pad,
        v1: 1 - (minY * step) / png.height - pad,
      };
      if (sprig.v0 < 0.2) continue;
      sprigs.push(sprig);
    }
  }
  if (sprigs.length < 1) throw new Error(`found ${sprigs.length} green twig sprites`);
  return sprigs;
}

function compositeTwig(diffPath, alphaPath) {
  const decoded = jpeg.decode(fs.readFileSync(diffPath), { formatAsRGBA: true, maxMemoryUsageInMB: 256 });
  const alpha = PNG.sync.read(fs.readFileSync(alphaPath));
  if (decoded.width !== alpha.width || decoded.height !== alpha.height) {
    throw new Error(`twig size ${decoded.width}x${decoded.height} vs alpha ${alpha.width}x${alpha.height}`);
  }
  const out = new PNG({ width: decoded.width, height: decoded.height });
  for (let i = 0; i < alpha.data.length; i += 4) {
    const red = decoded.data[i];
    const green = decoded.data[i + 1];
    const blue = decoded.data[i + 2];
    const opaque = alphaValue(alpha.data, i);
    const needle = opaque > 140 && green + 4 >= red && green > blue + 6 && green > 24;
    const lift = (value) => Math.min(255, Math.round(value * 1.45 + 10));
    out.data[i] = lift(red);
    out.data[i + 1] = lift(green);
    out.data[i + 2] = lift(blue);
    out.data[i + 3] = needle ? opaque : 0;
  }
  return { png: PNG.sync.write(out), alpha: out, color: decoded };
}

function hash01(n) {
  const mixed = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  return mixed / 4294967296;
}

function normalize(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function addCard(mesh, center, axisU, axisV, width, height, rect) {
  const [ux, uy, uz] = axisU;
  const [vx, vy, vz] = axisV;
  const hx = ux * width * 0.5;
  const hy = uy * width * 0.5;
  const hz = uz * width * 0.5;
  const vxh = vx * height * 0.5;
  const vyh = vy * height * 0.5;
  const vzh = vz * height * 0.5;
  const corners = [
    [center[0] - hx - vxh, center[1] - hy - vyh, center[2] - hz - vzh, rect.u0, rect.v0],
    [center[0] + hx - vxh, center[1] + hy - vyh, center[2] + hz - vzh, rect.u1, rect.v0],
    [center[0] + hx + vxh, center[1] + hy + vyh, center[2] + hz + vzh, rect.u1, rect.v1],
    [center[0] - hx + vxh, center[1] - hy + vyh, center[2] - hz + vzh, rect.u0, rect.v1],
  ];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const [nnx, nny, nnz] = normalize(nx, ny, nz);
  const base = mesh.positions.length / 3;
  for (const corner of corners) {
    mesh.positions.push(corner[0], corner[1], corner[2]);
    mesh.normals.push(nnx, nny, nnz);
    mesh.uvs.push(corner[3], corner[4]);
  }
  mesh.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function buildCards(positions, sprigs, cell, lean, cardHeight = 0.74, cross = 80) {
  const grid = new Map();
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const key = `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    const bin = grid.get(key) ?? { n: 0, x: 0, y: 0, z: 0 };
    bin.n += 1;
    bin.x += x;
    bin.y += y;
    bin.z += z;
    grid.set(key, bin);
  }
  const mesh = { positions: [], normals: [], uvs: [], indices: [] };
  let kept = 0;
  let cursor = 0;
  for (const bin of grid.values()) {
    cursor += 1;
    if (bin.n < 28) continue;
    kept += 1;
    const center = [bin.x / bin.n, bin.y / bin.n, bin.z / bin.n];
    const flat = Math.hypot(center[0], center[2]);
    const [rx, , rz] = normalize(flat < 0.05 ? 1 : center[0], 0, flat < 0.05 ? 0 : center[2]);
    const up = normalize(rx * lean, 1, rz * lean);
    const side = normalize(up[1] * rz - up[2] * 0, up[2] * rx - up[0] * rz, up[0] * 0 - up[1] * rx);
    const roll = hash01(cursor);
    const angle = roll * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const axisA = normalize(side[0] * cos + rx * sin, side[1] * cos, side[2] * cos + rz * sin);
    const axisB = normalize(side[0] * -sin + rx * cos, side[1] * -sin, side[2] * -sin + rz * cos);
    const rect = sprigs[cursor % sprigs.length];
    const aspect = (rect.u1 - rect.u0) / Math.max(0.04, rect.v1 - rect.v0);
    const height = cardHeight + roll * 0.32;
    const width = Math.min(0.95, Math.max(0.24, height * aspect * 1.2));
    addCard(mesh, center, axisA, up, width, height, rect);
    if (bin.n >= cross) addCard(mesh, center, axisB, up, width * 0.92, height * 0.94, sprigs[(cursor + 3) % sprigs.length]);
  }
  return {
    positions: Float32Array.from(mesh.positions),
    normals: Float32Array.from(mesh.normals),
    uvs: Float32Array.from(mesh.uvs),
    indices: Uint32Array.from(mesh.indices),
    clusters: grid.size,
    kept,
  };
}

function bounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      const value = positions[i + k];
      if (value < min[k]) min[k] = value;
      if (value > max[k]) max[k] = value;
    }
  }
  return { min, max };
}

function pushGeometry(binParts, views, accessors, positions, normals, uvs, indices) {
  const start = Buffer.concat(binParts).length;
  const pad = (4 - (start % 4)) % 4;
  if (pad) binParts.push(Buffer.alloc(pad));
  const base = start + pad;
  const posBytes = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);
  const norBytes = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength);
  const uvBytes = Buffer.from(uvs.buffer, uvs.byteOffset, uvs.byteLength);
  const idxBytes = Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength);
  const box = bounds(positions);
  const posView = views.length;
  views.push({ buffer: 0, byteOffset: base, byteLength: posBytes.length, target: 34962 });
  accessors.push({ bufferView: posView, componentType: 5126, count: positions.length / 3, type: "VEC3", min: box.min, max: box.max });
  const norView = views.length;
  views.push({ buffer: 0, byteOffset: base + posBytes.length, byteLength: norBytes.length, target: 34962 });
  accessors.push({ bufferView: norView, componentType: 5126, count: normals.length / 3, type: "VEC3" });
  const uvView = views.length;
  views.push({ buffer: 0, byteOffset: base + posBytes.length + norBytes.length, byteLength: uvBytes.length, target: 34962 });
  accessors.push({ bufferView: uvView, componentType: 5126, count: uvs.length / 2, type: "VEC2" });
  const idxView = views.length;
  views.push({ buffer: 0, byteOffset: base + posBytes.length + norBytes.length + uvBytes.length, byteLength: idxBytes.length, target: 34963 });
  accessors.push({ bufferView: idxView, componentType: 5125, count: indices.length, type: "SCALAR" });
  binParts.push(posBytes, norBytes, uvBytes, idxBytes);
  return { position: posView, normal: norView, uv: uvView, indices: idxView };
}

function writeGlb(file, document, bin) {
  const json = Buffer.from(JSON.stringify(document));
  const jsonPad = Buffer.alloc((4 - (json.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([json, jsonPad]);
  const binPad = Buffer.alloc((4 - (bin.length % 4)) % 4);
  const binChunk = Buffer.concat([bin, binPad]);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]));
}

async function reduce(job) {
  const gltf = JSON.parse(fs.readFileSync(path.join(root, job.gltf), "utf8"));
  const binPath = path.join(root, job.bin);
  const bin = fs.readFileSync(binPath);
  const base = resolveBase(bin.length, job);
  const mesh = gltf.meshes[job.meshIndex];
  const solids = [];
  const twigPositions = [];
  for (const primitive of mesh.primitives) {
    const material = gltf.materials[primitive.material];
    const role = roleOf(material.name);
    const positions = readAccessor(gltf, bin, base, primitive.attributes.POSITION);
    if (role === "bark") {
      console.log(`  ${material.name}: ${positions.length / 3} verts left out; the crown is the needle cards`);
      continue;
    }
    if (role === "twig") {
      twigPositions.push(positions);
      console.log(`  ${material.name}: ${primitive ? positions.length / 3 : 0} needle verts, rebuilt as cards`);
      continue;
    }
    const indices = readAccessor(gltf, bin, base, primitive.indices);
    let uvs = primitive.attributes.TEXCOORD_0 != null
      ? applyTransform(readAccessor(gltf, bin, base, primitive.attributes.TEXCOORD_0), textureTransform(material))
      : cylindricalUv(positions);
    const simplified = await simplifySolid(indices, positions, uvs, TARGET_TRIS[role] ?? 1500);
    const compactMesh = compact(simplified, positions, uvs);
    solids.push(compactMesh);
    console.log(`  ${material.name}: ${indices.length / 3} -> ${simplified.length / 3} tris`);
  }
  const bark = mergeParts(solids);
  const { png, alpha, color } = compositeTwig(
    path.join(root, job.textures, "twig_diff.jpg"),
    path.join(root, job.textures, "twig_alpha.png"),
  );
  const sprigs = findSprigs(alpha, color);
  const foliagePositions = twigPositions.length === 1 ? twigPositions[0] : Float32Array.from(twigPositions.flatMap((item) => Array.from(item)));
  const cards = buildCards(foliagePositions, sprigs, job.cell, job.lean, job.cardHeight, job.cross);
  console.log(`  sprigs ${sprigs.length}, foliage clusters ${cards.clusters}, cards kept ${cards.kept}, card tris ${cards.indices.length / 3}`);

  const binParts = [];
  const views = [];
  const accessors = [];
  const barkRef = pushGeometry(binParts, views, accessors, bark.positions, bark.normals, bark.uvs, bark.indices);
  const twigRef = pushGeometry(binParts, views, accessors, cards.positions, cards.normals, cards.uvs, cards.indices);
  const geometry = Buffer.concat(binParts);
  const barkDiff = fs.readFileSync(path.join(root, job.textures, "bark_diff.jpg"));
  const barkNor = fs.readFileSync(path.join(root, job.textures, "bark_nor.jpg"));
  const imageBase = geometry.length + ((4 - (geometry.length % 4)) % 4);
  const pad = imageBase - geometry.length;
  const images = Buffer.concat([geometry, Buffer.alloc(pad), barkDiff, barkNor, png]);
  const imageViews = [
    { buffer: 0, byteOffset: imageBase, byteLength: barkDiff.length },
    { buffer: 0, byteOffset: imageBase + barkDiff.length, byteLength: barkNor.length },
    { buffer: 0, byteOffset: imageBase + barkDiff.length + barkNor.length, byteLength: png.length },
  ];
  views.push(...imageViews);
  const imageIndex = views.length - 3;
  const triangles = bark.indices.length / 3 + cards.indices.length / 3;
  const document = {
    asset: {
      version: "2.0",
      generator: "hollow reduce-polyhaven",
      extras: { source: job.source, license: "CC0", triangles },
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: job.id, mesh: 0 }],
    meshes: [
      {
        name: job.id,
        primitives: [
          { attributes: { POSITION: barkRef.position, NORMAL: barkRef.normal, TEXCOORD_0: barkRef.uv }, indices: barkRef.indices, material: 0 },
          { attributes: { POSITION: twigRef.position, NORMAL: twigRef.normal, TEXCOORD_0: twigRef.uv }, indices: twigRef.indices, material: 1 },
        ],
      },
    ],
    materials: [
      {
        name: "bark",
        doubleSided: true,
        pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.86 },
        normalTexture: { index: 1 },
      },
      {
        name: "twig",
        alphaMode: "MASK",
        alphaCutoff: 0.42,
        doubleSided: true,
        pbrMetallicRoughness: { baseColorTexture: { index: 2 }, metallicFactor: 0, roughnessFactor: 0.74 },
      },
    ],
    textures: [{ source: 0 }, { source: 1 }, { source: 2 }],
    images: [
      { mimeType: "image/jpeg", bufferView: imageIndex },
      { mimeType: "image/jpeg", bufferView: imageIndex + 1 },
      { mimeType: "image/png", bufferView: imageIndex + 2 },
    ],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: images.length }],
  };
  const file = path.join(root, job.out);
  writeGlb(file, document, images);
  console.log(`${job.id}: ${triangles} tris, ${(fs.statSync(file).size / 1048576).toFixed(2)} MB -> ${job.out}`);
}

await MeshoptSimplifier.ready;
const only = process.argv[2];
for (const job of JOBS) {
  if (only && job.id !== only) continue;
  await reduce(job);
}
