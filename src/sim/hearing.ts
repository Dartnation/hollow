import { HEARING } from "./balance";
import type { Stimulus, Vec3 } from "./types";

export interface HearResult {
  heard: boolean;
  loudness: number;
  /** Only the stimulus position. Never a hidden player coordinate. */
  perceivedPosition: Vec3 | null;
}

export function rainMask(rain: number = HEARING.rain): number {
  return 1 - rain * HEARING.rainMask;
}

export function maxHearRange(intensity: number, mask: number): number {
  return HEARING.rangeBase + intensity * mask * HEARING.rangePerIntensity;
}

export function loudnessAt(intensity: number, distance: number, mask: number): number {
  return (intensity * mask) / (1 + distance * distance * HEARING.falloff);
}

/**
 * Event hearing. The listener only learns the sound's position when it is
 * actually loud enough. There is no player-position input.
 */
export function evaluateHearing(stimulus: Stimulus, listener: Vec3, rain = HEARING.rain): HearResult {
  const mask = rainMask(rain);
  const dx = stimulus.position.x - listener.x;
  const dy = stimulus.position.y - listener.y;
  const dz = stimulus.position.z - listener.z;
  const distance = Math.hypot(dx, dy, dz);
  const range = maxHearRange(stimulus.intensity, mask);
  const loudness = loudnessAt(stimulus.intensity, distance, mask);
  if (distance > range || loudness < HEARING.threshold) {
    return { heard: false, loudness, perceivedPosition: null };
  }
  return { heard: true, loudness, perceivedPosition: { ...stimulus.position } };
}
