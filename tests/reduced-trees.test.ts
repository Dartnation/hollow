import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function triangles(file: Buffer): number {
  expect(file.readUInt32LE(0)).toBe(0x46546c67);
  const jsonLength = file.readUInt32LE(12);
  const document = JSON.parse(file.subarray(20, 20 + jsonLength).toString("utf8")) as {
    meshes: { primitives: { indices: number }[] }[];
    accessors: { count: number }[];
    asset: { extras: { license: string } };
  };
  expect(document.asset.extras.license).toBe("CC0");
  let count = 0;
  for (const mesh of document.meshes) {
    for (const primitive of mesh.primitives) {
      count += (document.accessors[primitive.indices]?.count ?? 0) / 3;
    }
  }
  return count;
}

describe("reduced Poly Haven trees", () => {
  it("keeps each archetype inside a few thousand triangles", () => {
    for (const path of ["public/models/fir-tree.glb", "public/models/pine-tree.glb", "public/models/othonna.glb", "public/models/searsia.glb", "public/models/jacaranda.glb"]) {
      const file = readFileSync(path);
      expect(file.byteLength).toBeLessThan(8_000_000);
      const count = triangles(file);
      expect(count).toBeGreaterThan(1_500);
      const cap = path.endsWith("jacaranda.glb") ? 40_000 : path.endsWith("pine-tree.glb") ? 12_000 : 8_500;
      expect(count).toBeLessThan(cap);
    }
  });
});
