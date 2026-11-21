/// <reference types="vite/client" />

interface HollowPublicApi {
  ready: boolean;
  seed: number;
  errors: string[];
  start(): void;
  step(dt: number): void;
  placePlayer(x: number, z: number, yaw?: number): void;
  placeMonster(x: number, z: number): void;
  lookAt(x: number, z: number): void;
  interact(): string | null;
  hold(seconds: number): void;
  setFrequency(mhz: number): void;
  setHudVisible(visible: boolean): void;
  kill(): void;
  save(): void;
  load(): boolean;
  fps(): number;
  snapshot(): HollowSnapshot;
}

interface HollowSnapshot {
  mission: string;
  beat: string;
  route: string;
  checkpoint: number;
  lights: boolean;
  radio: boolean;
  radioLocked: boolean;
  antenna: boolean;
  notebook: boolean;
  doors: { front: boolean; side: boolean; shed: boolean };
  player: { x: number; y: number; z: number; yaw: number; crouching: boolean; flashlight: boolean };
  monster: {
    state: string;
    x: number;
    z: number;
    lastKnown: { x: number; z: number } | null;
    lastStimulus: { x: number; z: number } | null;
  };
  audio: { loaded: number; context: string };
  subtitle: string | null;
  prompt: string | null;
}

declare global {
  interface Window {
    __HOLLOW__?: HollowPublicApi;
  }
}

export {};
