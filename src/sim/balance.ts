/** Gameplay numbers shared by the simulation and the tests. */
export const SEED_DEFAULT = 170147;

export const SPEEDS = {
  walk: 3.05,
  run: 5.6,
  crouch: 1.45,
  monsterPatrol: 1.25,
  monsterInvestigate: 2.55,
  monsterChase: 4.85,
  monsterSearch: 1.7,
} as const;

export const BODY = {
  eye: 1.68,
  crouchEye: 1.02,
  radius: 0.34,
  step: 0.62,
  monsterEye: 1.95,
  monsterRadius: 0.42,
} as const;

export const HEARING = {
  /** loudness = intensity * mask / (1 + dist^2 * falloff) */
  falloff: 0.003,
  threshold: 0.018,
  rangeBase: 12,
  rangePerIntensity: 110,
  rain: 0.45,
  rainMask: 0.18,
  radioInterval: 1.55,
  generatorInterval: 1.7,
} as const;

export const VISION = {
  fovDeg: 80,
  range: 24,
  crouch: 0.7,
  hide: 0.35,
  flashlight: 1.3,
  security: 1.25,
  hideSpeed: 0.35,
  acquire: 0.28,
  loseGrace: 1.15,
  attackRange: 1.72,
  attackWindup: 0.5,
} as const;

export const AI_TIMERS = {
  idle: 2.6,
  listen: 1.15,
  loudListen: 0.38,
  search: 8.2,
  memory: 18,
  suspiciousLoudness: 0.08,
  arrive: 1.7,
} as const;

export const RADIO = {
  min: 88,
  max: 108,
  target: 97.4,
  start: 92,
  lockQuality: 0.93,
  lockHold: 1.15,
  spread: 0.42,
} as const;

export const ANTENNA_HOLD = 2.05;

export const FOOTSTEP_INTERVAL = {
  crouch: 0.62,
  walk: 0.48,
  run: 0.32,
} as const;

export const FOOTSTEP_INTENSITY: Record<string, Record<string, number>> = {
  dirt: { crouch: 0.07, walk: 0.28, run: 0.78 },
  wood: { crouch: 0.42, walk: 0.95, run: 1 },
  porch: { crouch: 0.12, walk: 0.4, run: 0.82 },
  floor: { crouch: 0.05, walk: 0.16, run: 0.4 },
  water: { crouch: 0.1, walk: 0.34, run: 0.8 },
};

export const OBJECTIVE: Record<string, string> = {
  ARRIVAL: "Find kilden til nødopkaldet. Følg det fjerne, varme lys.",
  APPROACH: "Nå skovfogedstationen. Broen er kort og højlydt. Skrænten er længere og mere skjult.",
  INSPECT_POWER: "Undersøg elpanelet i hytten.",
  DIVERT_POWER: "Kun én kreds kan holdes aktiv. Send strøm til radioen.",
  TUNE_SIGNAL: "Indstil radioen, til bærebølgen er ren.",
  REPAIR_LINK: "Forbindelsen brød. Fastlås antennen ved generatorskuret.",
  ESCAPE: "Nå den sikre passage mod nordøst. Løb kun når du må.",
  COMPLETE: "Signal modtaget. Kilde ukendt.",
};

export const COPY = {
  carRadio: "...station sytten... nogen der kan høre mig?",
  sign: "SKOVTJENESTEN — ANLÆG LUKKET",
  notebook:
    "Kun én kreds kan holdes aktiv. Lys eller sender. Kanal 17. Bærebølgen ligger nær 97,4. Lås når metret står i det hvide felt, og suset bliver til en ren tone.",
  paradox: "Hvis du kan høre det her ... så er du allerede nået ind.",
  breakLine: "Signalet knækker. Antennen holder ikke.",
  ending: "SIGNAL RECEIVED — SOURCE UNKNOWN",
  dead: "Den fandt dig.",
  radioDead: "Radioen er død. Den mangler strøm.",
  passageDark: "Porten er stadig mørk.",
} as const;
