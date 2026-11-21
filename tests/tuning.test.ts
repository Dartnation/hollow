import { describe, expect, it } from "vitest";
import { RADIO } from "../src/sim/balance";
import { presentTuning, signalQuality } from "../src/sim/tuning";

describe("radio tuning", () => {
  it("peaks on the notebook frequency and falls off both ways", () => {
    const peak = signalQuality(RADIO.target);
    expect(peak).toBeGreaterThan(0.99);
    expect(signalQuality(RADIO.target - 0.2)).toBeGreaterThan(signalQuality(RADIO.target - 1.2));
    expect(signalQuality(RADIO.target + 0.2)).toBeGreaterThan(signalQuality(RADIO.target + 1.2));
    const low = presentTuning(92);
    const near = presentTuning(97.4);
    expect(low.locked).toBe(false);
    expect(low.staticGain).toBeGreaterThan(near.staticGain);
    expect(near.toneGain).toBeGreaterThan(low.toneGain);
    expect(near.locked).toBe(true);
    expect(presentTuning(96).side).toBe(-1);
    expect(presentTuning(99).side).toBe(1);
  });
});
