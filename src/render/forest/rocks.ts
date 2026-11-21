import { Matrix, Mesh, Quaternion, Scene, Vector3 } from "@babylonjs/core";
import type { GameSim } from "../../sim/game";
import { groundHeight } from "../../sim/world";
import { pbr } from "../materials";
import { MeshAccum } from "./mesh";

function stone(scene: Scene, index: number): Mesh {
  const accum = new MeshAccum();
  const lobes = 4 + (index % 3);
  for (let i = 0; i < lobes; i += 1) {
    const ang = (i / lobes) * Math.PI * 2;
    const reach = 0.28 + (i % 2) * 0.12;
    accum.addTaper(
      new Vector3(0, 0.08, 0),
      new Vector3(Math.cos(ang) * reach, 0.22 + (i % 3) * 0.08, Math.sin(ang) * reach * 0.8),
      0.34,
      0.12,
      5,
      0.18,
    );
  }
  const mesh = accum.bake(`stone-${index}`, scene);
  mesh.material = pbr(scene, `stone-mat-${index}`, index === 1 ? "#6a645c" : "#4e5854", 0.9, 0.04);
  return mesh;
}

export function buildStones(scene: Scene, sim: GameSim): void {
  const prototypes = [0, 1, 2].map((index) => stone(scene, index));
  const groups = prototypes.map(() => [] as number[]);
  sim.world.rocks.forEach((_, index) => groups[index % 3]?.push(index));
  prototypes.forEach((mesh, group) => {
    const ids = groups[group] ?? [];
    const firstId = ids[0];
    const first = firstId === undefined ? undefined : sim.world.rocks[firstId];
    if (!first) {
      mesh.setEnabled(false);
      return;
    }
    mesh.position.set(first.x, groundHeight(first.x, first.z) + first.height * 0.2, first.z);
    mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(first.rot, 0.1, 0.2);
    mesh.scaling.set(first.scale, first.height, first.scale * 0.85);
    const rest = ids.slice(1);
    if (!rest.length) return;
    const buffer = new Float32Array(rest.length * 16);
    const matrix = new Matrix();
    rest.forEach((id, index) => {
      const rock = sim.world.rocks[id];
      if (!rock) return;
      Matrix.ComposeToRef(
        new Vector3(rock.scale, rock.height, rock.scale * 0.85),
        Quaternion.RotationYawPitchRoll(rock.rot, 0.1, 0.15),
        new Vector3(rock.x, groundHeight(rock.x, rock.z) + rock.height * 0.2, rock.z),
        matrix,
      );
      matrix.copyToArray(buffer, index * 16);
    });
    mesh.thinInstanceSetBuffer("matrix", buffer, 16, false);
    mesh.receiveShadows = true;
  });
}
