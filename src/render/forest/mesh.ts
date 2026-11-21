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

  /** A camera-facing-independent quad. `right` and `up` are the card axes. */
  addCard(center: Vector3, right: Vector3, up: Vector3, width: number, height: number): void {
    if (right.lengthSquared() < 0.0001 || up.lengthSquared() < 0.0001) return;
    const rx = right.normalize().scale(width * 0.5);
    const uy = up.normalize().scale(height * 0.5);
    const corners = [
      center.subtract(rx).subtract(uy),
      center.add(rx).subtract(uy),
      center.add(rx).add(uy),
      center.subtract(rx).add(uy),
    ];
    const normal = Vector3.Cross(rx, uy).normalize();
    const base = this.positions.length / 3;
    for (const corner of corners) {
      this.positions.push(corner.x, corner.y, corner.z);
      this.normals.push(normal.x, normal.y, normal.z);
    }
    this.uvs.push(0, 1, 1, 1, 1, 0, 0, 0);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
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
