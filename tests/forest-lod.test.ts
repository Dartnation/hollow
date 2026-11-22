import { Matrix, Mesh, NullEngine, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import { describe, expect, it } from "vitest";
import { forestMoved, lodTier } from "../src/render/forest/lod";
import { placeThin } from "../src/render/forest/thin";
import { composeThinTranslation, IDENTITY_MASTER } from "../src/render/forest/thinMath";

describe("forest lod", () => {
  it("does not refresh buffers across a 4m camera step", () => {
    expect(forestMoved(2.2, 8, 6.2, 11)).toBe(false);
    expect(forestMoved(2.2, 8, 2.2, 21)).toBe(true);
  });

  it("keeps a tree on the far mesh until the camera is close", () => {
    expect(lodTier(80, null)).toBe("far");
    expect(lodTier(20, null)).toBe("mid");
    expect(lodTier(10, null)).toBe("near");
    expect(lodTier(15, "near")).toBe("near");
    expect(lodTier(30, "near")).toBe("mid");
  });
});

describe("thin instance placement", () => {
  it("keeps an identity master from doubling a translation", () => {
    const tree = { x: 25, y: 4, z: 45, scale: 1.4 };
    const fixed = composeThinTranslation(IDENTITY_MASTER, tree);
    expect(fixed.x).toBeCloseTo(25);
    expect(fixed.y).toBeCloseTo(4);
    expect(fixed.z).toBeCloseTo(45);
    expect(fixed.scale).toBeCloseTo(1.4);
    const doubled = composeThinTranslation(tree, tree);
    expect(doubled.x).toBeCloseTo(25 + 1.4 * 25);
    expect(doubled.z).toBeCloseTo(45 + 1.4 * 45);
  });

  it("stores every instance, including the first, against an identity mesh", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const mesh = Mesh.CreateBox("trunk", 1, scene);
    const poses = [
      { x: 25, y: 3.2, z: 45, scale: 1.2 },
      { x: 2.2, y: 1.1, z: 8, scale: 0.9 },
    ];
    const matrices = poses.map((pose) =>
      Matrix.Compose(new Vector3(pose.scale, pose.scale, pose.scale), Quaternion.Identity(), new Vector3(pose.x, pose.y, pose.z)),
    );
    placeThin(mesh, matrices);
    mesh.computeWorldMatrix(true);
    const master = mesh.getWorldMatrix().getTranslation();
    expect(master.length()).toBeLessThan(0.001);
    expect(mesh.scaling.x).toBeCloseTo(1);
    const stored = mesh.thinInstanceGetWorldMatrices();
    expect(stored).toHaveLength(2);
    stored.forEach((instance, index) => {
      const pose = poses[index];
      const world = mesh.getWorldMatrix().multiply(instance);
      const at = world.getTranslation();
      expect(pose).toBeDefined();
      expect(at.x).toBeCloseTo(pose?.x ?? 0);
      expect(at.y).toBeCloseTo(pose?.y ?? 0);
      expect(at.z).toBeCloseTo(pose?.z ?? 0);
    });
    scene.dispose();
    engine.dispose();
  });
});
