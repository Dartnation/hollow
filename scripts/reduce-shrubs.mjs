/**
 * Game-ready GLBs for two CC0 Poly Haven shrubs.
 * Raw downloads stay in .cache/polyhaven.
 *
 *   node scripts/reduce-shrubs.mjs
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
const cache = path.join(root, ".cache/polyhaven");

const JOBS = [
  {
    id: "othonna",
    gltf: "othonna_cerarioides_1k.gltf",
    bin: "othonna/othonna_cerarioides.bin",
    diff: "othonna/diff.jpg",
    alpha: "othonna/alpha.png",
    meshIndex: 2,
    source: "https://polyhaven.com/a/othonna_cerarioides",
    targets: { leaf: 3200, solid: 2400, twig: 1200 },
  },
  {
    id: "searsia",
    gltf: "searsia_burchellii_1k.gltf",
    bin: "searsia/searsia_burchellii.bin",
    diff: "searsia/diff.jpg",
    alpha: "searsia/alpha.png",
    meshIndex: 2,
    source: "https://polyhaven.com/a/searsia_burchellii",
    targets: { leaf: 3000, solid: 2400, twig: 1400 },
  },
];

function readAccessor(gltf, bin, accessorIndex) {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type];
  if (accessor.componentType === 5126) {
    const copy = Buffer.alloc(accessor.count * components * 4);
    bin.copy(copy, 0, offset, offset + copy.length);
    return new Float32Array(copy.buffer, copy.byteOffset, accessor.count * components);
  }
  if (accessor.componentType === 5123 || accessor.componentType === 5125) {
    const width = accessor.componentType === 5123 ? 2 : 4;
    const copy = Buffer.alloc(accessor.count * width);
    bin.copy(copy, 0, offset, offset + copy.length);
    if (width === 4) return new Uint32Array(copy.buffer, copy.byteOffset, accessor.count);
    const wide = new Uint32Array(accessor.count);
    const narrow = new Uint16Array(copy.buffer, copy.byteOffset, accessor.count);
    for (let i = 0; i < accessor.count; i += 1) wide[i] = narrow[i];
    return wide;
  }
  throw new Error(`component ${accessor.componentType}`);
}

function roleOf(name) {
  const text = name.toLowerCase();
  if (text.includes("leaf")) return "leaf";
  if (text.includes("twig")) return "twig";
  return "solid";
}

async function simplify(indices, positions, uvs, targetTris) {
  await MeshoptSimplifier.ready;
  const aligned = Math.min(indices.length, targetTris * 3);
  const target = aligned - (aligned % 3);
  if (indices.length <= target) return indices;
  let limit = 0.01;
  let best = indices;
  while (limit <= 0.4) {
    const [out] = MeshoptSimplifier.simplifyWithAttributes(
      indices,
      positions,
      3,
      uvs,
      2,
      [0.4, 0.4],
      null,
      target,
      limit,
      ["RegularizeLight"],
    );
    best = out;
    if (out.length <= target * 1.2) break;
    limit *= 1.6;
  }
  return best;
}

function compact(indices, positions, uvs) {
  const remap = new Int32Array(positions.length / 3).fill(-1);
  const pos = [];
  const uv = [];
  const idx = [];
  for (const source of indices) {
    let next = remap[source];
    if (next < 0) {
      next = pos.length / 3;
      remap[source] = next;
      pos.push(positions[source * 3], positions[source * 3 + 1], positions[source * 3 + 2]);
      uv.push(uvs[source * 2], uvs[source * 2 + 1]);
    }
    idx.push(next);
  }
  const packedPos = Float32Array.from(pos);
  const packedIdx = Uint32Array.from(idx);
  const normals = new Float32Array(packedPos.length);
  for (let i = 0; i < packedIdx.length; i += 3) {
    const a = packedIdx[i] * 3;
    const b = packedIdx[i + 1] * 3;
    const c = packedIdx[i + 2] * 3;
    const ax = packedPos[b] - packedPos[a];
    const ay = packedPos[b + 1] - packedPos[a + 1];
    const az = packedPos[b + 2] - packedPos[a + 2];
    const bx = packedPos[c] - packedPos[a];
    const by = packedPos[c + 1] - packedPos[a + 1];
    const bz = packedPos[c + 2] - packedPos[a + 2];
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
  return { positions: packedPos, normals, uvs: Float32Array.from(uv), indices: packedIdx };
}

function composite(diffPath, alphaPath) {
  const decoded = jpeg.decode(fs.readFileSync(diffPath), { formatAsRGBA: true });
  const alpha = PNG.sync.read(fs.readFileSync(alphaPath));
  if (decoded.width !== alpha.width || decoded.height !== alpha.height) {
    throw new Error(`size ${decoded.width} vs ${alpha.width}`);
  }
  const out = new PNG({ width: decoded.width, height: decoded.height });
  for (let i = 0; i < alpha.data.length; i += 4) {
    const mask = alpha.data[i + 3] < 250 ? alpha.data[i + 3] : alpha.data[i];
    out.data[i] = decoded.data[i];
    out.data[i + 1] = decoded.data[i + 1];
    out.data[i + 2] = decoded.data[i + 2];
    out.data[i + 3] = mask;
  }
  return PNG.sync.write(out);
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

function writeGlb(file, document, bin) {
  const json = Buffer.from(JSON.stringify(document));
  const jsonPad = Buffer.alloc((4 - (json.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([json, jsonPad]);
  const binPad = Buffer.alloc((4 - (bin.length % 4)) % 4);
  const binChunk = Buffer.concat([bin, binPad]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]));
}

await MeshoptSimplifier.ready;
for (const job of JOBS) {
  const gltf = JSON.parse(fs.readFileSync(path.join(cache, job.gltf), "utf8"));
  const bin = fs.readFileSync(path.join(cache, job.bin));
  const mesh = gltf.meshes[job.meshIndex];
  const parts = [];
  for (const primitive of mesh.primitives) {
    const material = gltf.materials[primitive.material];
    const role = roleOf(material.name);
    const positions = readAccessor(gltf, bin, primitive.attributes.POSITION);
    const indices = readAccessor(gltf, bin, primitive.indices);
    const uvs = primitive.attributes.TEXCOORD_0 != null
      ? readAccessor(gltf, bin, primitive.attributes.TEXCOORD_0)
      : new Float32Array((positions.length / 3) * 2);
    const simplified = await simplify(indices, positions, uvs, job.targets[role]);
    parts.push({ role, ...compact(simplified, positions, uvs) });
    console.log(`  ${material.name}: ${indices.length / 3} -> ${simplified.length / 3}`);
  }
  const leafPng = composite(path.join(cache, job.diff), path.join(cache, job.alpha));
  const stemJpg = fs.readFileSync(path.join(cache, job.diff));
  const views = [];
  const accessors = [];
  const chunks = [];
  const primitives = [];
  let triangles = 0;
  for (const part of parts) {
    const start = Buffer.concat(chunks).length;
    const pad = (4 - (start % 4)) % 4;
    if (pad) chunks.push(Buffer.alloc(pad));
    const base = start + pad;
    const posBytes = Buffer.from(part.positions.buffer, part.positions.byteOffset, part.positions.byteLength);
    const norBytes = Buffer.from(part.normals.buffer, part.normals.byteOffset, part.normals.byteLength);
    const uvBytes = Buffer.from(part.uvs.buffer, part.uvs.byteOffset, part.uvs.byteLength);
    const idxBytes = Buffer.from(part.indices.buffer, part.indices.byteOffset, part.indices.byteLength);
    const box = bounds(part.positions);
    const position = accessors.length;
    views.push({ buffer: 0, byteOffset: base, byteLength: posBytes.length, target: 34962 });
    accessors.push({ bufferView: views.length - 1, componentType: 5126, count: part.positions.length / 3, type: "VEC3", min: box.min, max: box.max });
    views.push({ buffer: 0, byteOffset: base + posBytes.length, byteLength: norBytes.length, target: 34962 });
    accessors.push({ bufferView: views.length - 1, componentType: 5126, count: part.normals.length / 3, type: "VEC3" });
    views.push({ buffer: 0, byteOffset: base + posBytes.length + norBytes.length, byteLength: uvBytes.length, target: 34962 });
    accessors.push({ bufferView: views.length - 1, componentType: 5126, count: part.uvs.length / 2, type: "VEC2" });
    views.push({ buffer: 0, byteOffset: base + posBytes.length + norBytes.length + uvBytes.length, byteLength: idxBytes.length, target: 34963 });
    accessors.push({ bufferView: views.length - 1, componentType: 5125, count: part.indices.length, type: "SCALAR" });
    chunks.push(posBytes, norBytes, uvBytes, idxBytes);
    const cutout = part.role !== "solid";
    primitives.push({
      attributes: { POSITION: position, NORMAL: position + 1, TEXCOORD_0: position + 2 },
      indices: position + 3,
      material: cutout ? 1 : 0,
    });
    triangles += part.indices.length / 3;
  }
  const geometry = Buffer.concat(chunks);
  const imageBase = geometry.length + ((4 - (geometry.length % 4)) % 4);
  const images = Buffer.concat([geometry, Buffer.alloc(imageBase - geometry.length), stemJpg, leafPng]);
  views.push(
    { buffer: 0, byteOffset: imageBase, byteLength: stemJpg.length },
    { buffer: 0, byteOffset: imageBase + stemJpg.length, byteLength: leafPng.length },
  );
  const document = {
    asset: { version: "2.0", generator: "hollow reduce-shrubs", extras: { source: job.source, license: "CC0", triangles } },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: job.id, mesh: 0 }],
    meshes: [{ name: job.id, primitives }],
    materials: [
      { name: "stem", doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.84 } },
      { name: "leaves", alphaMode: "MASK", alphaCutoff: 0.45, doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 1 }, metallicFactor: 0, roughnessFactor: 0.7 } },
    ],
    textures: [{ source: 0 }, { source: 1 }],
    images: [
      { mimeType: "image/jpeg", bufferView: views.length - 2 },
      { mimeType: "image/png", bufferView: views.length - 1 },
    ],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: images.length }],
  };
  const file = path.join(root, "public/models", `${job.id}.glb`);
  writeGlb(file, document, images);
  console.log(`${job.id}: ${triangles} tris, ${(fs.statSync(file).size / 1048576).toFixed(2)} MB`);
}
