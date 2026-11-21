import { Mesh, Scene, VertexData, Vector3 } from "@babylonjs/core";

/** Append-only mesh. One draw call after it is baked. */
export class MeshAccum {
  private readonly positions: number[] = [];
  private readonly indices: number[] = [];
  private readonly normals: number[] = [];
  private readonly uvs: number[] = [];

  addTaper(p0: Vector3, p1: Vector3, r0: number, r1: number, sides: number, ridge = 0): void {
    const axis = p1.subtract(p0);
    const len = axis.length();
    if (len < 0.001) return;
    const dir = axis.scale(1 / len);
    const helper = Math.abs(dir.y) > 0.92 ? Vector3.Right() : Vector3.Up();
    const side = Vector3.Cross(dir, helper).normalize();
    const up = Vector3.Cross(side, dir).normalize();
    const base = this.positions.length / 3;
    for (let ring = 0; ring < 2; ring += 1) {
      const center = ring === 0 ? p0 : p1;
      const radius = ring === 0 ? r0 : r1;
      for (let s = 0; s < sides; s += 1) {
        const ang = (s / sides) * Math.PI * 2;
        const wave = 1 + ridge * Math.sin(ang * 3 + ring * 1.7);
        const radial = side.scale(Math.cos(ang) * radius * wave).add(up.scale(Math.sin(ang) * radius * wave));
        const pos = center.add(radial);
        this.positions.push(pos.x, pos.y, pos.z);
        this.normals.push(radial.x, radial.y, radial.z);
        this.uvs.push(s / sides, ring === 0 ? 0 : len);
      }
    }
    for (let s = 0; s < sides; s += 1) {
      const n = (s + 1) % sides;
      const a0 = base + s;
      const a1 = base + n;
      const b0 = base + sides + s;
      const b1 = base + sides + n;
      this.indices.push(a0, b0, a1, a1, b0, b1);
    }
  }

  bake(name: string, scene: Scene): Mesh {
    const mesh = new Mesh(name, scene);
    const data = new VertexData();
    data.positions = this.positions;
    data.indices = this.indices;
    data.uvs = this.uvs;
    const normals = new Float32Array(this.positions.length);
    VertexData.ComputeNormals(this.positions, this.indices, normals);
    data.normals = normals;
    data.applyToMesh(mesh);
    return mesh;
  }
}
