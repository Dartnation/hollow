import { AUDIO_FILES, type AudioKey } from "../audio/manifest";
import type { AudioCue } from "../sim/types";
import type { GameSim } from "../sim/game";
import { INTERACT, LANDMARKS } from "../sim/layout";
import { groundHeight } from "../sim/world";

interface Loop {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner?: PannerNode;
}

/** Playback stays off until a later audio pass. Buffers still load so tests can count them. */
const PLAYBACK = false;

export class AudioEngine {
  readonly context = new AudioContext();
  loaded = 0;
  private buffers = new Map<AudioKey, AudioBuffer>();
  private master: GainNode;
  private ambience?: Loop;
  private rain?: Loop;
  private generator?: Loop;
  private staticLoop?: Loop;
  private tone?: Loop;
  private monster?: Loop;
  private compressor: DynamicsCompressorNode;

  constructor() {
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 2.4;
    this.master = this.context.createGain();
    this.master.gain.value = 0.85;
    this.compressor.connect(this.master);
    this.master.connect(this.context.destination);
    const listener = this.context.listener;
    if (listener.forwardX) {
      listener.upX.value = 0;
      listener.upY.value = 1;
      listener.upZ.value = 0;
    }
  }

  async load(): Promise<void> {
    const entries = Object.entries(AUDIO_FILES) as [AudioKey, string][];
    await Promise.all(
      entries.map(async ([key, url]) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Lyd mangler: ${url}`);
        const audio = await this.context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(key, audio);
        this.loaded += 1;
      }),
    );
    if (!PLAYBACK) return;
    this.ambience = this.loop("ambience", 0.55);
    this.rain = this.loop("rain", 0.22);
    this.generator = this.loop("generator", 0, this.worldPoint(LANDMARKS.shed.x, LANDMARKS.shed.z));
    this.staticLoop = this.loop("static", 0, this.worldPoint(INTERACT.radio.x, INTERACT.radio.z));
    this.tone = this.loop("tone", 0, this.worldPoint(INTERACT.radio.x, INTERACT.radio.z));
    this.monster = this.loop("monster", 0, { x: 78, y: 2, z: 190 });
  }

  async resume(): Promise<void> {
    if (!PLAYBACK) return;
    if (this.context.state !== "running") await this.context.resume();
  }

  update(sim: GameSim, cues: AudioCue[]): void {
    if (!PLAYBACK || this.context.state !== "running") return;
    const listener = this.context.listener;
    const yaw = sim.player.yaw;
    const pitch = sim.player.pitch;
    const fx = Math.sin(yaw) * Math.cos(pitch);
    const fy = Math.sin(pitch);
    const fz = Math.cos(yaw) * Math.cos(pitch);
    if (listener.positionX) {
      listener.positionX.value = sim.player.x;
      listener.positionY.value = sim.player.y + 1.68;
      listener.positionZ.value = sim.player.z;
      listener.forwardX.value = fx;
      listener.forwardY.value = fy;
      listener.forwardZ.value = fz;
    }
    const tuning = sim.tuningView();
    const radioOn = sim.mission.radio && sim.started;
    this.setGain(this.staticLoop, radioOn ? (sim.tuning ? tuning.staticGain : sim.mission.beat === "transmitting" ? 0.08 : 0.28) : 0);
    this.setGain(this.tone, radioOn && (sim.tuning || sim.mission.beat === "transmitting") ? tuning.toneGain : 0);
    if (this.tone) this.tone.source.playbackRate.value = tuning.playbackRate;
    this.setGain(this.generator, radioOn ? 0.55 : 0);
    const distance = Math.hypot(sim.monster.x - sim.player.x, sim.monster.z - sim.player.z);
    const menace = sim.brain.state === "CHASE" || sim.brain.state === "ATTACK" ? 0.7 : 0.28;
    this.setGain(this.monster, sim.started && distance < 30 ? menace * (1 - distance / 32) : 0);
    this.move(this.monster, sim.monster.x, sim.monster.y + 1.6, sim.monster.z);
    for (const cue of cues) this.playCue(cue);
  }

  private playCue(cue: AudioCue): void {
    const key: AudioKey =
      cue.kind === "door" ? "door" : cue.kind === "generator" ? "generator" : cue.kind === "radio" ? "static" : cue.surface === "wood" || cue.surface === "porch" ? "footWood" : "footDirt";
    const buffer = this.buffers.get(key);
    if (!buffer) return;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gain = this.context.createGain();
    gain.gain.value = Math.min(0.9, 0.25 + cue.intensity * 0.55);
    const panner = this.panner();
    panner.positionX.value = cue.position.x;
    panner.positionY.value = cue.position.y;
    panner.positionZ.value = cue.position.z;
    source.connect(gain);
    gain.connect(panner);
    panner.connect(this.compressor);
    source.start();
  }

  private loop(key: AudioKey, gainValue: number, at?: { x: number; y: number; z: number }): Loop {
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(key) ?? null;
    source.loop = true;
    const gain = this.context.createGain();
    gain.gain.value = gainValue;
    let panner: PannerNode | undefined;
    if (at) {
      panner = this.panner();
      panner.positionX.value = at.x;
      panner.positionY.value = at.y;
      panner.positionZ.value = at.z;
      source.connect(gain);
      gain.connect(panner);
      panner.connect(this.compressor);
    } else {
      source.connect(gain);
      gain.connect(this.compressor);
    }
    source.start();
    return { source, gain, ...(panner ? { panner } : {}) };
  }

  private panner(): PannerNode {
    const panner = this.context.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 2.5;
    panner.maxDistance = 90;
    panner.rolloffFactor = 1.15;
    return panner;
  }

  private setGain(loop: Loop | undefined, value: number): void {
    if (!loop) return;
    loop.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.08);
  }

  private move(loop: Loop | undefined, x: number, y: number, z: number): void {
    if (!loop?.panner) return;
    loop.panner.positionX.value = x;
    loop.panner.positionY.value = y;
    loop.panner.positionZ.value = z;
  }

  private worldPoint(x: number, z: number): { x: number; y: number; z: number } {
    return { x, y: groundHeight(x, z) + 1, z };
  }
}
