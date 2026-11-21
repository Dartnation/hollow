import { RADIO } from "./balance";
import { clamp } from "./rng";

export interface TuningView {
  mhz: number;
  quality: number;
  staticGain: number;
  toneGain: number;
  playbackRate: number;
  locked: boolean;
  /** -1 too low, 1 too high, 0 centered. Pitch carries the same information. */
  side: -1 | 0 | 1;
}

export function signalQuality(mhz: number): number {
  const d = mhz - RADIO.target;
  return Math.exp(-(d * d) / RADIO.spread);
}

export function presentTuning(mhz: number): TuningView {
  const clamped = clamp(mhz, RADIO.min, RADIO.max);
  const quality = signalQuality(clamped);
  const side = Math.abs(clamped - RADIO.target) < 0.08 ? 0 : clamped < RADIO.target ? -1 : 1;
  return {
    mhz: clamped,
    quality,
    staticGain: 0.62 * (1 - quality * 0.94),
    toneGain: Math.max(0, quality - 0.08) * 0.85,
    playbackRate: 0.72 + Math.abs(clamped - RADIO.target) * 0.16,
    locked: quality >= RADIO.lockQuality,
    side,
  };
}
