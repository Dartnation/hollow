import { VISION } from "./balance";

export interface VisionQuery {
  hasLineOfSight: boolean;
  angleDeg: number;
  distance: number;
  crouching: boolean;
  speed: number;
  flashlightOn: boolean;
  hiding: boolean;
  inSecurityLight: boolean;
}

export function visionRange(query: Pick<VisionQuery, "crouching" | "speed" | "flashlightOn" | "hiding" | "inSecurityLight">): number {
  let range = VISION.range;
  if (query.crouching) range *= VISION.crouch;
  if (query.hiding && query.crouching && query.speed < VISION.hideSpeed && !query.flashlightOn) {
    range *= VISION.hide;
  }
  if (query.flashlightOn) range *= VISION.flashlight;
  if (query.inSecurityLight) range *= VISION.security;
  return range;
}

/** Sight is a sensor result. False LOS never returns a detection. */
export function canSee(query: VisionQuery): boolean {
  if (!query.hasLineOfSight) return false;
  if (query.angleDeg > VISION.fovDeg * 0.5) return false;
  if (query.distance > visionRange(query)) return false;
  return query.distance > 0.15;
}
