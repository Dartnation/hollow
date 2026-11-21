/**
 * Babylon's thin-instance shader does `finalWorld = world * instance`.
 * A master translation therefore adds to every instance. The forest keeps
 * the master at identity and stores absolute instance matrices.
 */
export interface ThinPose {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export function composeThinTranslation(master: ThinPose, instance: ThinPose): ThinPose {
  return {
    x: master.x + master.scale * instance.x,
    y: master.y + master.scale * instance.y,
    z: master.z + master.scale * instance.z,
    scale: master.scale * instance.scale,
  };
}

export const IDENTITY_MASTER: ThinPose = { x: 0, y: 0, z: 0, scale: 1 };
