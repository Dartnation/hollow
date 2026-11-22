/**
 * Cheaper LOD copies of the reduced fir and pine.
 *   node scripts/lod-forest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { MeshoptSimplifier } from "meshoptimizer";

const root = path.resolve(import.meta.dirname, "..");
const LEVELS = [
  { suffix: "mid", bark: 360, cards: 280, grow: 1.5 },
  { suffix: "far", bark: 140, cards: 72, grow: 2.15 },
];

function readGlb(file) {
  const buf = fs.readFileSync(file);
  const jsonLength = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString("utf8"));
  const binStart = 20 + jsonLength + 8;
  return { json, bin: buf.subarray(binStart) };
}

function readAccessor(gltf, bin, index) {
  const accessor = gltf.accessors[index];
  const view = gltf.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3 }[accessor.type];
  const copy = Buffer.alloc(accessor.count * components * 4);
  bin.copy(copy, 0, offset, offset + copy.length);
  if (accessor.componentType === 5126) return new Float32Array(copy.buffer, copy.byteOffset, accessor.count * components);
  if (accessor.componentType === 5125) return new Uint32Array(copy.buffer, copy.byteOffset, accessor.count);
  const narrow = new Uint16Array(copy.buffer, copy.byteOffset, accessor.count);
  const wide = new Uint32Array(accessor.count);
  for (let i = 0; i < accessor.count; i += 1) wide[i] = narrow[i];
  return wide;
}

function keepCards(positions, indices, cards, grow) {
  const stride = 6;
  const count = Math.floor(indices.length / stride);
  const step = Math.max(1, Math.ceil(count / cards));
  const out = [];
  const grown = new Float32Array(positions);
  for (let card = 0; card < count; card += step) {
    const ids = [];
    for (let corner = 0; corner < stride; corner += 1) {
      const index = indices[card * stride + corner];
      out.push(index);
      ids.push(index);
    }
    const unique = [...new Set(ids)];
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (const id of unique) {
      cx += grown[id * 3];
      cy += grown[id * 3 + 1];
      cz += grown[id * 3 + 2];
    }
    cx /= unique.length;
    cy /= unique.length;
    cz /= unique.length;
    for (const id of unique) {
      grown[id * 3] = cx + (grown[id * 3] - cx) * grow;
      grown[id * 3 + 1] = cy + (grown[id * 3 + 1] - cy) * grow;
      grown[id * 3 + 2] = cz + (grown[id * 3 + 2] - cz) * grow;
    }
  }
  return { indices: Uint32Array.from(out), positions: grown };
}

function simplify(indices, positions, uvs, targetTris) {
  const target = targetTris * 3;
  if (indices.length <= target) return indices;
  let best = indices;
  let limit = 0.01;
  while (limit <= 0.08 && best.length > target * 1.15) {
    const [out] = MeshoptSimplifier.simplifyWithAttributes(
      best,
      positions,
      3,
      uvs,
      2,
      [0.2, 0.2],
      null,
      target,
      limit,
      ["Permissive"],
    );
    if (out.length < target * 0.55 && best.length < target * 4) break;
    best = out;
    if (out.length <= target * 1.15) break;
    limit *= 1.8;
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
      uv.push(uvs[source * 2] ?? 0, uvs[source * 2 + 1] ?? 0);
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
    normals[a] += ay * bz - az * by;
    normals[a + 1] += az * bx - ax * bz;
    normals[a + 2] += ax * by - ay * bx;
    normals[b] += ay * bz - az * by;
    normals[b + 1] += az * bx - ax * bz;
    normals[b + 2] += ax * by - ay * bx;
    normals[c] += ay * bz - az * by;
    normals[c + 1] += az * bx - ax * bz;
    normals[c + 2] += ax * by - ay * bx;
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= length;
    normals[i + 1] /= length;
    normals[i + 2] /= length;
  }
  return { positions: packedPos, normals, uvs: Float32Array.from(uv), indices: packedIdx };
}

function bounds(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      if (positions[i + k] < min[k]) min[k] = positions[i + k];
      if (positions[i + k] > max[k]) max[k] = positions[i + k];
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
  fs.writeFileSync(file, Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]));
}

function imageBytes(gltf, bin, image) {
  const view = gltf.bufferViews[image.bufferView];
  const start = view.byteOffset || 0;
  return Buffer.from(bin.subarray(start, start + view.byteLength));
}

await MeshoptSimplifier.ready;
for (const name of ["fir-tree", "pine-tree"]) {
  const { json, bin } = readGlb(path.join(root, "public/models", `${name}.glb`));
  const parts = json.meshes[0].primitives.map((primitive) => {
    const material = json.materials[primitive.material];
    const positions = readAccessor(json, bin, primitive.attributes.POSITION);
    const indices = readAccessor(json, bin, primitive.indices);
    const uvs = readAccessor(json, bin, primitive.attributes.TEXCOORD_0);
    return { role: material.name === "twig" ? "twig" : "bark", positions, indices, uvs };
  });
  const images = json.images.map((image) => imageBytes(json, bin, image));
  for (const level of LEVELS) {
    const views = [];
    const accessors = [];
    const chunks = [];
    const primitives = [];
    let triangles = 0;
    for (const part of parts) {
      const kept = part.role === "twig" ? keepCards(part.positions, part.indices, level.cards, level.grow) : null;
      const simplified = kept ? kept.indices : simplify(part.indices, part.positions, part.uvs, level.bark);
      const packed = compact(simplified, kept ? kept.positions : part.positions, part.uvs);
      const start = Buffer.concat(chunks).length;
      const pad = (4 - (start % 4)) % 4;
      if (pad) chunks.push(Buffer.alloc(pad));
      const base = start + pad;
      const posBytes = Buffer.from(packed.positions.buffer, packed.positions.byteOffset, packed.positions.byteLength);
      const norBytes = Buffer.from(packed.normals.buffer, packed.normals.byteOffset, packed.normals.byteLength);
      const uvBytes = Buffer.from(packed.uvs.buffer, packed.uvs.byteOffset, packed.uvs.byteLength);
      const idxBytes = Buffer.from(packed.indices.buffer, packed.indices.byteOffset, packed.indices.byteLength);
      const box = bounds(packed.positions);
      const position = accessors.length;
      views.push({ buffer: 0, byteOffset: base, byteLength: posBytes.length, target: 34962 });
      accessors.push({ bufferView: views.length - 1, componentType: 5126, count: packed.positions.length / 3, type: "VEC3", min: box.min, max: box.max });
      views.push({ buffer: 0, byteOffset: base + posBytes.length, byteLength: norBytes.length, target: 34962 });
      accessors.push({ bufferView: views.length - 1, componentType: 5126, count: packed.normals.length / 3, type: "VEC3" });
      views.push({ buffer: 0, byteOffset: base + posBytes.length + norBytes.length, byteLength: uvBytes.length, target: 34962 });
      accessors.push({ bufferView: views.length - 1, componentType: 5126, count: packed.uvs.length / 2, type: "VEC2" });
      views.push({ buffer: 0, byteOffset: base + posBytes.length + norBytes.length + uvBytes.length, byteLength: idxBytes.length, target: 34963 });
      accessors.push({ bufferView: views.length - 1, componentType: 5125, count: packed.indices.length, type: "SCALAR" });
      chunks.push(posBytes, norBytes, uvBytes, idxBytes);
      primitives.push({
        attributes: { POSITION: position, NORMAL: position + 1, TEXCOORD_0: position + 2 },
        indices: position + 3,
        material: part.role === "twig" ? 1 : 0,
      });
      triangles += packed.indices.length / 3;
    }
    const geometry = Buffer.concat(chunks);
    const imageBase = geometry.length + ((4 - (geometry.length % 4)) % 4);
    const blob = Buffer.concat([geometry, Buffer.alloc(imageBase - geometry.length), ...images]);
    let cursor = imageBase;
    for (const image of images) {
      views.push({ buffer: 0, byteOffset: cursor, byteLength: image.length });
      cursor += image.length;
    }
    const file = path.join(root, "public/models", `${name.replace("-tree", "")}-${level.suffix}.glb`);
    writeGlb(file, {
      asset: { version: "2.0", generator: "hollow lod-forest", extras: { ...json.asset.extras, lod: level.suffix, triangles } },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{ primitives }],
      materials: json.materials,
      textures: json.textures,
      images: json.images.map((image, index) => ({ mimeType: image.mimeType, bufferView: views.length - images.length + index })),
      samplers: json.samplers,
      accessors,
      bufferViews: views,
      buffers: [{ byteLength: blob.length }],
    }, blob);
    console.log(`${path.basename(file)}: ${triangles} tris`);
  }
}
