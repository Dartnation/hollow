import { MonsterBrain, type Heard } from "./ai";
import { ANTENNA_HOLD, BODY, COPY, HEARING, OBJECTIVE, RADIO, SPEEDS, VISION } from "./balance";
import { evaluateHearing } from "./hearing";
import { CHECKPOINTS, INTERACT, LANDMARKS, MONSTER_HOME, PATROL } from "./layout";
import { lineOfSight } from "./los";
import { initialMission, reduceMission, type Mission } from "./mission";
import { boxBlocks, footstepIntensity, footstepType, pointBlocked, resolveMove } from "./movement";
import { cellOf, findPath } from "./nav";
import { angleDelta, clamp, distance2 } from "./rng";
import { parseSave, serializeSave, type SaveData, type Snap } from "./save";
import { presentTuning, type TuningView } from "./tuning";
import type { Aabb, AiState, AudioCue, Doors, Gait, Input, Sight, Stimulus, Surface, Vec2, Vec3 } from "./types";
import { EMPTY_INPUT } from "./types";
import { canSee } from "./vision";
import {
  bridgeQuery,
  createWorld,
  groundHeight,
  inHide,
  inSecurityZone,
  indoors,
  monsterEyeY,
  nearFork,
  nearHut,
  nearPassage,
  onSlope,
  playerChestY,
  slopeFactor,
  surfaceAt,
  waterDrag,
  type World,
} from "./world";

export interface GameSnapshot {
  mission: Mission["state"];
  beat: Mission["beat"];
  route: Mission["route"];
  checkpoint: Mission["checkpoint"];
  lights: boolean;
  radio: boolean;
  radioLocked: boolean;
  antenna: boolean;
  notebook: boolean;
  doors: Doors;
  player: { x: number; y: number; z: number; yaw: number; pitch: number; crouching: boolean; flashlight: boolean; speed: number };
  monster: {
    state: AiState;
    x: number;
    z: number;
    yaw: number;
    lastKnown: { x: number; z: number } | null;
    lastStimulus: { x: number; z: number } | null;
  };
  subtitle: string | null;
  prompt: string | null;
  banner: string | null;
  tuning: boolean;
  mhz: number;
  quality: number;
  antennaHold: number;
  paused: boolean;
  journal: boolean;
  mode: "title" | "play" | "dead" | "complete";
}

interface Actor {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  speed: number;
}

const FOCUS = [
  { id: "car-radio", ...INTERACT.carRadio },
  { id: "sign", ...INTERACT.sign },
  { id: "bridge-sign", ...INTERACT.bridgeSign },
  { id: "slope-sign", ...INTERACT.slopeSign },
  { id: "notebook", ...INTERACT.notebook },
  { id: "panel", ...INTERACT.panel },
  { id: "radio", ...INTERACT.radio },
  { id: "front-door", ...INTERACT.frontDoor },
  { id: "side-door", ...INTERACT.sideDoor },
  { id: "shed-door", ...INTERACT.shedDoor },
  { id: "hunt-door", ...INTERACT.huntDoor },
  { id: "antenna", ...INTERACT.antenna },
  { id: "passage", ...INTERACT.passage },
] as const;

export class GameSim {
  readonly world: World;
  readonly seed: number;
  mission: Mission;
  player: Actor;
  monster: Actor;
  brain: MonsterBrain;
  mode: GameSnapshot["mode"] = "title";
  started = false;
  paused = false;
  journal = false;
  tuning = false;
  flashlight = false;
  crouching = false;
  mhz: number = RADIO.start;
  antennaHold = 0;
  time = 0;
  subtitle: string | null = null;
  banner: string | null = null;
  cues: AudioCue[] = [];

  private crouchLatched = false;
  private subtitleUntil = 0;
  private bannerUntil = 0;
  private lockTimer = 0;
  private transmitTimer = 0;
  private travel = 0;
  private monsterTravel = 0;
  private radioTimer = 0.4;
  private generatorTimer = 0.6;
  private acquire = 0;
  private deadTimer = 0;
  private wasInside = false;
  private stimuli: Stimulus[] = [];
  private path: Vec2[] | null = null;
  private pathKey = "";
  private replan = 0;
  private stuck = 0;
  private snaps: Partial<Record<1 | 2 | 3, Snap>> = {};
  private doorBoxes: readonly Aabb[] = [];

  constructor(seed: number) {
    this.seed = seed;
    this.world = createWorld(seed);
    this.doorBoxes = this.world.boxes.filter((box) => box.door);
    this.mission = initialMission();
    const spawn = CHECKPOINTS[1];
    this.player = { x: spawn.x, y: groundHeight(spawn.x, spawn.z), z: spawn.z, yaw: spawn.yaw, pitch: 0, speed: 0 };
    this.monster = {
      x: MONSTER_HOME.x,
      y: groundHeight(MONSTER_HOME.x, MONSTER_HOME.z),
      z: MONSTER_HOME.z,
      yaw: 0.4,
      pitch: 0,
      speed: 0,
    };
    this.brain = new MonsterBrain(PATROL);
    this.capture(1);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.mode = "play";
    this.say(COPY.carRadio, 6.5);
    this.banner = OBJECTIVE.ARRIVAL ?? null;
    this.bannerUntil = this.time + 7;
  }

  step(dt: number, input: Input = EMPTY_INPUT): AudioCue[] {
    let left = Math.max(0, dt);
    this.cues = [];
    while (left > 0.0001) {
      const h = Math.min(0.05, left);
      this.stepOnce(h, left === dt ? input : { ...input, interactPressed: false, flashlightToggle: false, journalToggle: false, pauseToggle: false, crouchToggle: false });
      left -= h;
      input = { ...input, interactPressed: false, flashlightToggle: false, journalToggle: false, pauseToggle: false, crouchToggle: false, tuneDelta: 0 };
    }
    return this.cues;
  }

  interact(): string | null {
    const id = this.focusId();
    if (!id) return null;
    this.use(id);
    return id;
  }

  placePlayer(x: number, z: number, yaw?: number): void {
    this.wasInside = false;
    this.player.x = x;
    this.player.z = z;
    this.player.y = groundHeight(x, z);
    if (yaw !== undefined) this.player.yaw = yaw;
    if (this.started) this.refreshRegions();
  }

  placeMonster(x: number, z: number): void {
    this.monster.x = x;
    this.monster.z = z;
    this.monster.y = groundHeight(x, z);
    this.path = null;
  }

  lookAt(x: number, z: number, pitch = 0): void {
    this.player.yaw = Math.atan2(x - this.player.x, z - this.player.z);
    this.player.pitch = pitch;
  }

  setFrequency(mhz: number): void {
    this.mhz = clamp(mhz, RADIO.min, RADIO.max);
  }

  hold(seconds: number): void {
    this.step(seconds, { ...EMPTY_INPUT, interactHeld: true });
  }

  kill(): void {
    if (this.mode === "dead" || this.mode === "complete") return;
    this.mode = "dead";
    this.deadTimer = 2.2;
    this.tuning = false;
    this.say(COPY.dead, 2.2);
  }

  toSave(): SaveData {
    return {
      version: 1,
      seed: this.seed,
      mission: this.mission.state,
      beat: this.mission.beat,
      route: this.mission.route,
      lights: this.mission.lights,
      radio: this.mission.radio,
      radioLocked: this.mission.radioLocked,
      antenna: this.mission.antenna,
      notebook: this.mission.notebook,
      signRead: this.mission.signRead,
      doors: { ...this.mission.doors },
      checkpoint: this.mission.checkpoint,
      mhz: this.mhz,
      tuning: this.tuning,
      flashlight: this.flashlight,
      crouch: this.crouching,
      player: { x: this.player.x, z: this.player.z, yaw: this.player.yaw, pitch: this.player.pitch },
      snaps: this.snaps,
    };
  }

  serialize(): string {
    return serializeSave(this.toSave());
  }

  load(raw: string): boolean {
    const data = parseSave(raw);
    if (!data || data.seed !== this.seed) return false;
    this.applySave(data);
    return true;
  }

  tuningView(): TuningView {
    return presentTuning(this.mhz);
  }

  prompt(): string | null {
    const id = this.focusId();
    if (!id || this.mode !== "play" || this.paused || this.journal) return null;
    return this.promptFor(id);
  }

  snapshot(): GameSnapshot {
    const tune = presentTuning(this.mhz);
    return {
      mission: this.mission.state,
      beat: this.mission.beat,
      route: this.mission.route,
      checkpoint: this.mission.checkpoint,
      lights: this.mission.lights,
      radio: this.mission.radio,
      radioLocked: this.mission.radioLocked,
      antenna: this.mission.antenna,
      notebook: this.mission.notebook,
      doors: { ...this.mission.doors },
      player: { ...this.player, crouching: this.crouching, flashlight: this.flashlight },
      monster: {
        state: this.brain.state,
        x: this.monster.x,
        z: this.monster.z,
        yaw: this.monster.yaw,
        lastKnown: this.brain.lastKnown ? { x: this.brain.lastKnown.x, z: this.brain.lastKnown.z } : null,
        lastStimulus: this.brain.lastStimulus ? { x: this.brain.lastStimulus.x, z: this.brain.lastStimulus.z } : null,
      },
      subtitle: this.subtitle,
      prompt: this.prompt(),
      banner: this.time < this.bannerUntil ? this.banner : null,
      tuning: this.tuning,
      mhz: this.mhz,
      quality: tune.quality,
      antennaHold: this.antennaHold / ANTENNA_HOLD,
      paused: this.paused,
      journal: this.journal,
      mode: this.mode,
    };
  }

  private stepOnce(dt: number, input: Input): void {
    this.time += dt;
    if (this.subtitle && this.time > this.subtitleUntil) this.subtitle = null;
    if (!this.started) return;
    if (input.pauseToggle) {
      this.paused = !this.paused;
      if (this.paused) {
        this.journal = false;
        this.tuning = false;
      }
    }
    if (input.journalToggle && !this.paused && this.mode === "play") this.journal = !this.journal;
    if (input.flashlightToggle) this.flashlight = !this.flashlight;
    if (input.crouchToggle) this.crouchLatched = !this.crouchLatched;
    this.crouching = input.crouchHold || this.crouchLatched;
    if (this.paused || this.journal) return;

    if (this.mode === "dead") {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.restore();
      return;
    }
    if (this.mode === "complete") return;

    this.player.yaw += input.yawDelta;
    this.player.pitch = clamp(this.player.pitch + input.pitchDelta, -1.05, 1.2);
    if (this.tuning) this.updateTuning(dt, input.tuneDelta);
    else this.movePlayer(dt, input);

    this.refreshRegions();
    if (input.interactPressed) this.interact();
    this.tickAntenna(dt, input);
    this.tickEmitters(dt);
    this.tickTransmit(dt);
    const caught = this.tickMonster(dt);
    if (caught) this.kill();
  }

  private movePlayer(dt: number, input: Input): void {
    const moving = Math.hypot(input.forward, input.strafe) > 0.05;
    const gait: Gait = this.crouching ? "crouch" : input.run ? "run" : "walk";
    const surface = surfaceAt(this.player.x, this.player.z);
    let speed = this.crouching ? SPEEDS.crouch : input.run ? SPEEDS.run : SPEEDS.walk;
    speed *= slopeFactor(this.player.x, this.player.z) * waterDrag(surface);
    const norm = Math.hypot(input.forward, input.strafe) || 1;
    const f = input.forward / norm;
    const s = input.strafe / norm;
    const dx = (Math.sin(this.player.yaw) * f + Math.cos(this.player.yaw) * s) * speed * dt;
    const dz = (Math.cos(this.player.yaw) * f - Math.sin(this.player.yaw) * s) * speed * dt;
    const beforeX = this.player.x;
    const beforeZ = this.player.z;
    const beforeY = this.player.y;
    if (moving) {
      const next = resolveMove(this.player.x, this.player.z, dx, dz, BODY.radius, this.world.boxes, this.mission.doors);
      const nextY = groundHeight(next.x, next.z);
      if (nextY - beforeY <= BODY.step) {
        this.player.x = next.x;
        this.player.z = next.z;
        this.player.y = nextY;
      }
    }
    const moved = Math.hypot(this.player.x - beforeX, this.player.z - beforeZ);
    this.player.speed = moved / dt;
    if (moved > 0.001) {
      this.travel += moved;
      const stride = gait === "run" ? 1.55 : gait === "crouch" ? 0.85 : 1.25;
      if (this.travel >= stride) {
        this.travel = 0;
        this.emitFootstep(gait, surface);
      }
    }
  }

  private emitFootstep(gait: Gait, surface: Surface): void {
    const intensity = footstepIntensity(surface, gait);
    const position = { x: this.player.x, y: this.player.y, z: this.player.z };
    this.stimuli.push({
      type: footstepType(surface, gait),
      position,
      intensity,
      time: this.time,
      sourceId: "player",
    });
    this.cues.push({ kind: "footstep", position, intensity, surface });
  }

  private refreshRegions(): void {
    const prev = this.mission.state;
    if (this.mission.route === "none") {
      if (bridgeQuery(this.player.x, this.player.z)) this.mission = reduceMission(this.mission, { type: "CHOOSE_ROUTE", route: "bridge" });
      else if (onSlope(this.player.x, this.player.z)) this.mission = reduceMission(this.mission, { type: "CHOOSE_ROUTE", route: "slope" });
    }
    if (nearFork(this.player.x, this.player.z) || nearHut(this.player.x, this.player.z)) {
      this.mission = reduceMission(this.mission, { type: "REACH_LANDMARK" });
    }
    const inside = indoors(this.player.x, this.player.z);
    if (inside && !this.wasInside) {
      const before = this.mission.checkpoint;
      this.mission = reduceMission(this.mission, { type: "ENTER_HUT" });
      if (this.mission.checkpoint >= 2 && before < 2) this.capture(2);
    }
    this.wasInside = inside;
    if (nearPassage(this.player.x, this.player.z)) this.mission = reduceMission(this.mission, { type: "REACH_PASSAGE" });
    if (this.mission.state === "COMPLETE" && this.mode === "play") {
      this.mode = "complete";
      this.tuning = false;
      this.say(`${COPY.paradox} ${COPY.ending}`, 12);
    }
    if (this.mission.state !== prev && this.mode === "play") {
      this.banner = OBJECTIVE[this.mission.state] ?? null;
      this.bannerUntil = this.time + 6.5;
    }
  }

  private use(id: string): void {
    if (this.mode !== "play") return;
    switch (id) {
      case "car-radio":
        this.say(COPY.carRadio, 5);
        break;
      case "sign":
      case "bridge-sign":
      case "slope-sign":
        this.mission = reduceMission(this.mission, { type: "READ_SIGN" });
        this.say(id === "slope-sign" ? "Skrænten er længere, men træerne skjuler dig." : id === "bridge-sign" ? "Broen er kort. Træet bærer lyden langt." : COPY.sign, 4.5);
        break;
      case "notebook":
        this.mission = reduceMission(this.mission, { type: "READ_NOTEBOOK" });
        this.say(COPY.notebook, 8);
        break;
      case "panel":
        this.usePanel();
        break;
      case "radio":
        this.useRadio();
        break;
      case "front-door":
        this.toggleDoor("front");
        break;
      case "side-door":
        this.toggleDoor("side");
        break;
      case "shed-door":
        this.toggleDoor("shed");
        break;
      case "hunt-door":
        this.toggleDoor("hunt");
        break;
      case "passage":
        if (this.mission.state !== "ESCAPE") this.say(COPY.passageDark, 2.5);
        break;
      default:
        break;
    }
  }

  private usePanel(): void {
    const state = this.mission.state;
    if (state === "ARRIVAL" || state === "APPROACH" || state === "INSPECT_POWER") {
      this.mission = reduceMission(this.mission, { type: "INSPECT_PANEL" });
      this.say("Kun én kreds kan holdes aktiv. Lys eller sender.", 4.5);
      if (this.mission.checkpoint < 2) this.capture(2);
      return;
    }
    if (this.mission.lights) {
      this.mission = reduceMission(this.mission, { type: "DIVERT_TO_RADIO" });
      this.say("Sikkerhedslyset slukker. Radioen trækker vejret.", 4);
      this.cues.push({ kind: "generator", position: this.shedPos(), intensity: 0.8 });
      this.pushNoise("generator", this.shedPos(), 0.9, "generator");
    } else {
      this.mission = reduceMission(this.mission, { type: "RESTORE_LIGHTS" });
      this.say("Senderen dør. Lyset vender tilbage.", 3.2);
      this.tuning = false;
    }
  }

  private useRadio(): void {
    if (!this.mission.radio) {
      this.say(COPY.radioDead, 3);
      return;
    }
    if (this.mission.state === "REPAIR_LINK" || this.mission.beat === "broken") {
      this.say("Bærebølgen falder fra hinanden. Antennen udenfor er løs.", 4);
      return;
    }
    if (this.mission.beat === "transmitting") return;
    this.tuning = !this.tuning;
    if (this.tuning) this.say("Drej frekvensen. Suset bliver tyndere, når du nærmer dig.", 3.5);
  }

  private toggleDoor(door: "front" | "side" | "shed" | "hunt"): void {
    const open = !this.mission.doors[door];
    this.mission = reduceMission(this.mission, { type: "SET_DOOR", door, open });
    const spot = door === "front" ? INTERACT.frontDoor : door === "side" ? INTERACT.sideDoor : door === "shed" ? INTERACT.shedDoor : INTERACT.huntDoor;
    const pos = this.point(spot);
    this.cues.push({ kind: "door", position: pos, intensity: 0.8 });
    this.pushNoise("door", pos, 0.8, `door-${door}`);
    this.path = null;
  }

  private updateTuning(dt: number, delta: number): void {
    if (delta) this.mhz = clamp(this.mhz + delta, RADIO.min, RADIO.max);
    if (!this.mission.radio || this.mission.state !== "TUNE_SIGNAL" || this.mission.beat !== "none") {
      this.lockTimer = 0;
      return;
    }
    const view = presentTuning(this.mhz);
    this.lockTimer = view.locked ? this.lockTimer + dt : 0;
    if (this.lockTimer >= RADIO.lockHold) {
      this.mission = reduceMission(this.mission, { type: "TUNE_LOCKED" });
      this.tuning = false;
      this.transmitTimer = 3.5;
      this.say(COPY.paradox, 4.2);
      this.cues.push({ kind: "radio", position: this.radioPos(), intensity: 0.7 });
    }
  }

  private tickTransmit(dt: number): void {
    if (this.mission.beat !== "transmitting") return;
    this.transmitTimer -= dt;
    if (this.transmitTimer <= 0) {
      this.mission = reduceMission(this.mission, { type: "BREAK_LINK" });
      this.say(COPY.breakLine, 4.5);
      this.banner = OBJECTIVE.REPAIR_LINK ?? null;
      this.bannerUntil = this.time + 6.5;
      this.cues.push({ kind: "radio", position: this.radioPos(), intensity: 1 });
    }
  }

  private tickAntenna(dt: number, input: Input): void {
    const focused = this.focusId() === "antenna" && this.mission.state === "REPAIR_LINK";
    if (focused && (input.interactHeld || input.interactPressed)) {
      this.antennaHold += dt;
      if (Math.floor((this.antennaHold - dt) / 0.45) !== Math.floor(this.antennaHold / 0.45)) {
        this.pushNoise("generator", this.point(INTERACT.antenna), 1, "antenna");
        this.cues.push({ kind: "generator", position: this.point(INTERACT.antenna), intensity: 1 });
      }
      if (this.antennaHold >= ANTENNA_HOLD) {
        this.mission = reduceMission(this.mission, { type: "REPAIR_ANTENNA" });
        this.capture(3);
        this.antennaHold = 0;
        this.say("Antennen låser. Signalet slipper fri. Gå mod passagen.", 4.5);
        this.pushNoise("generator", this.point(INTERACT.antenna), 1, "antenna-lock");
      }
    } else {
      this.antennaHold = 0;
    }
  }

  private tickEmitters(dt: number): void {
    if (!this.mission.radio) return;
    this.radioTimer -= dt;
    this.generatorTimer -= dt;
    if (this.radioTimer <= 0) {
      this.radioTimer = HEARING.radioInterval;
      this.pushNoise("radio", this.radioPos(), 0.86, "radio");
    }
    if (this.generatorTimer <= 0) {
      this.generatorTimer = HEARING.generatorInterval;
      this.pushNoise("generator", this.shedPos(), 0.74, "generator");
    }
  }

  private senseDt = 0.05;

  private tickMonster(dt: number): boolean {
    this.senseDt = dt;
    const heard = this.loudestHeard();
    this.stimuli = [];
    const sight = this.senseSight();
    const result = this.brain.update(dt, this.time, { x: this.monster.x, z: this.monster.z }, sight, heard);
    const rate = this.brain.state === "CHASE" ? 4.8 : 2.2;
    this.brain.turnToward(dt, rate);
    this.monster.yaw = this.brain.yaw;
    this.moveMonster(dt);
    return result.caught;
  }

  // senseDt is set by tickMonster so the vision timer follows the substep.

  private senseSight(): Sight | null {
    const eye = { x: this.monster.x, y: monsterEyeY(this.monster.y), z: this.monster.z };
    const chest = {
      x: this.player.x,
      y: playerChestY(this.crouching, this.player.y),
      z: this.player.z,
    };
    const dx = chest.x - eye.x;
    const dz = chest.z - eye.z;
    const distance = Math.hypot(dx, dz);
    const angle = Math.abs(angleDelta(this.monster.yaw, Math.atan2(dx, dz))) * (180 / Math.PI);
    const los = lineOfSight(eye, chest, this.sightBoxes());
    const visible = canSee({
      hasLineOfSight: los,
      angleDeg: angle,
      distance,
      crouching: this.crouching,
      speed: this.player.speed,
      flashlightOn: this.flashlight,
      hiding: inHide(this.player.x, this.player.z),
      inSecurityLight: this.mission.lights && inSecurityZone(this.player.x, this.player.z),
    });
    if (visible) this.acquire += this.senseDt;
    else this.acquire = 0;
    const armed = this.brain.state === "CHASE" || this.brain.state === "ATTACK";
    if (!visible || (this.acquire < VISION.acquire && !armed)) return null;
    return { position: { x: this.player.x, y: chest.y, z: this.player.z }, distance };
  }

  private loudestHeard(): Heard | null {
    const ear = { x: this.monster.x, y: monsterEyeY(this.monster.y), z: this.monster.z };
    let best: Heard | null = null;
    for (const stimulus of this.stimuli) {
      if (stimulus.sourceId === "monster") continue;
      const result = evaluateHearing(stimulus, ear);
      if (!result.heard || !result.perceivedPosition) continue;
      if (!best || result.loudness > best.loudness) {
        best = { position: result.perceivedPosition, loudness: result.loudness };
      }
    }
    return best;
  }

  private moveMonster(dt: number): void {
    const goal = this.brain.goal;
    this.monster.speed = 0;
    if (!goal || this.brain.speed <= 0) return;
    const key = `${goal.x.toFixed(1)}:${goal.z.toFixed(1)}:${this.mission.doors.front}:${this.mission.doors.side}:${this.mission.doors.shed}:${this.mission.doors.hunt}`;
    this.replan -= dt;
    if (!this.path || this.replan <= 0 || key !== this.pathKey) {
      this.path = this.lineClear(goal) ? [goal] : findPath(this.world.grid, this.monster, goal, (x, z) => this.doorBlocks(x, z));
      this.pathKey = key;
      this.replan = this.path ? 0.7 : 1.6;
    }
    const waypoint = this.path?.[0];
    const target = waypoint ?? goal;
    const dx = target.x - this.monster.x;
    const dz = target.z - this.monster.z;
    const dist = Math.hypot(dx, dz) || 1;
    const step = Math.min(dist, this.brain.speed * slopeFactor(this.monster.x, this.monster.z) * dt);
    const nx = this.monster.x + (dx / dist) * step;
    const nz = this.monster.z + (dz / dist) * step;
    if (pointBlocked(nx, nz, BODY.monsterRadius, this.world.boxes, this.mission.doors)) {
      this.path = null;
      if (this.replan < 0.45) this.replan = 0.45;
      this.stuck += dt;
      return;
    }
    const nextY = groundHeight(nx, nz);
    if (nextY - this.monster.y > 0.9) {
      this.path = null;
      this.stuck += dt;
      return;
    }
    const beforeX = this.monster.x;
    const beforeZ = this.monster.z;
    this.monster.x = nx;
    this.monster.z = nz;
    this.monster.y = nextY;
    const moved = Math.hypot(nx - beforeX, nz - beforeZ);
    this.monster.speed = moved / dt;
    this.stuck = moved < 0.004 ? this.stuck + dt : 0;
    if (this.stuck > 1.4) {
      this.path = null;
      this.stuck = 0;
      if (this.brain.state === "PATROL") this.brain.goal = PATROL[(Math.floor(this.time) + 1) % PATROL.length] ?? goal;
    }
    if (waypoint && dist < 0.85) this.path?.shift();
    this.monsterTravel += moved;
    if (this.monsterTravel > 1.7) {
      this.monsterTravel = 0;
      this.cues.push({
        kind: "footstep",
        position: { x: this.monster.x, y: this.monster.y, z: this.monster.z },
        intensity: 0.45,
        surface: "dirt",
      });
    }
  }

  private lineClear(goal: Vec2): boolean {
    const steps = Math.ceil(distance2(this.monster.x, this.monster.z, goal.x, goal.z) / this.world.grid.cell);
    for (let i = 1; i <= steps; i += 1) {
      const t = i / Math.max(1, steps);
      const x = this.monster.x + (goal.x - this.monster.x) * t;
      const z = this.monster.z + (goal.z - this.monster.z) * t;
      const cell = cellOf(this.world.grid, x, z);
      if (cell.cx < 0 || cell.cz < 0 || cell.cx >= this.world.grid.w || cell.cz >= this.world.grid.h) return false;
      if (this.world.grid.blocked[cell.cz * this.world.grid.w + cell.cx]) return false;
      if (this.doorBlocks(x, z)) return false;
    }
    return true;
  }

  private doorBlocks(x: number, z: number): boolean {
    for (const box of this.doorBoxes) {
      if (!box.door || this.mission.doors[box.door]) continue;
      if (x > box.minX - 0.55 && x < box.maxX + 0.55 && z > box.minZ - 0.55 && z < box.maxZ + 0.55) return true;
    }
    return false;
  }

  private sightBoxes() {
    return this.world.boxes.filter((box) => boxBlocks(box, this.mission.doors, "sight"));
  }

  private focusId(): string | null {
    let best: { id: string; d: number } | null = null;
    for (const point of FOCUS) {
      const dx = point.x - this.player.x;
      const dz = point.z - this.player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > point.radius) continue;
      const facing = Math.abs(angleDelta(this.player.yaw, Math.atan2(dx, dz)));
      if (facing > 0.9 && dist > 1.15) continue;
      const score = dist + facing * 1.6;
      if (!best || score < best.d) best = { id: point.id, d: score };
    }
    return best?.id ?? null;
  }

  private promptFor(id: string): string {
    switch (id) {
      case "car-radio":
        return "Lyt til bilradioen";
      case "sign":
        return "Læs skiltet";
      case "bridge-sign":
        return "Broen — kort og højlydt";
      case "slope-sign":
        return "Skrænten — længere og skjult";
      case "notebook":
        return "Læs notesbogen";
      case "panel":
        if (this.mission.state === "ARRIVAL" || this.mission.state === "APPROACH" || this.mission.state === "INSPECT_POWER") {
          return "Undersøg elpanelet";
        }
        return this.mission.lights ? "Send strøm til senderen" : "Tænd sikkerhedslyset";
      case "radio":
        if (!this.mission.radio) return "Radioen mangler strøm";
        if (this.mission.state === "REPAIR_LINK") return "Signalet er brudt";
        return this.tuning ? "Drej frekvensen" : "Indstil radioen";
      case "front-door":
        return this.mission.doors.front ? "Luk fordøren" : "Åbn fordøren";
      case "side-door":
        return this.mission.doors.side ? "Luk sidedøren" : "Åbn sidedøren";
      case "shed-door":
        return this.mission.doors.shed ? "Luk skurdøren" : "Åbn skurdøren";
      case "hunt-door":
        return this.mission.doors.hunt ? "Luk døren" : "Åbn døren";
      case "antenna":
        if (this.mission.state === "REPAIR_LINK") return "Hold E — fastlås antennen";
        return this.mission.antenna ? "Antennen er låst" : "Antennen svarer ikke";
      case "passage":
        return this.mission.state === "ESCAPE" ? "Gå ind i passagen" : "Porten er mørk";
      default:
        return "Brug";
    }
  }

  private pushNoise(type: Stimulus["type"], position: Vec3, intensity: number, sourceId: string): void {
    this.stimuli.push({ type, position, intensity, time: this.time, sourceId });
  }

  private point(p: { x: number; z: number }): Vec3 {
    return { x: p.x, y: groundHeight(p.x, p.z) + 1, z: p.z };
  }

  private radioPos(): Vec3 {
    return this.point(INTERACT.radio);
  }

  private shedPos(): Vec3 {
    return { x: LANDMARKS.shed.x, y: groundHeight(LANDMARKS.shed.x, LANDMARKS.shed.z) + 0.7, z: LANDMARKS.shed.z };
  }

  private say(text: string, seconds: number): void {
    this.subtitle = text;
    this.subtitleUntil = this.time + seconds;
  }

  private capture(level: 1 | 2 | 3): void {
    const spawn = CHECKPOINTS[level];
    const doors = { ...this.mission.doors };
    if (level === 2) doors.front = true;
    if (level === 3) {
      doors.front = true;
      doors.shed = true;
    }
    this.snaps[level] = {
      mission: this.mission.state,
      beat: this.mission.beat,
      route: this.mission.route,
      lights: this.mission.lights,
      radio: this.mission.radio,
      radioLocked: this.mission.radioLocked,
      antenna: this.mission.antenna,
      notebook: this.mission.notebook,
      signRead: this.mission.signRead,
      doors,
      checkpoint: level,
      mhz: this.mhz,
      player: { x: spawn.x, z: spawn.z, yaw: spawn.yaw },
    };
    this.mission = { ...this.mission, checkpoint: level };
  }

  private restore(): void {
    const level = this.mission.checkpoint;
    const snap = this.snaps[level] ?? this.snaps[1];
    if (!snap) return;
    this.applySnap(snap);
    this.mode = "play";
    this.deadTimer = 0;
    this.subtitle = null;
    this.banner = "Checkpoint genindlæst.";
    this.bannerUntil = this.time + 3.5;
  }

  private applySnap(snap: Snap): void {
    this.mission = {
      state: snap.mission,
      beat: snap.beat,
      route: snap.route,
      lights: snap.lights,
      radio: snap.radio,
      radioLocked: snap.radioLocked,
      antenna: snap.antenna,
      notebook: snap.notebook,
      signRead: snap.signRead,
      doors: { ...snap.doors },
      checkpoint: snap.checkpoint,
    };
    this.mhz = snap.mhz;
    this.placePlayer(snap.player.x, snap.player.z, snap.player.yaw);
    this.tuning = false;
    this.antennaHold = 0;
    this.acquire = 0;
    this.lockTimer = 0;
    this.transmitTimer = 0;
    this.crouching = false;
    this.crouchLatched = false;
    this.resetMonster(snap.checkpoint);
  }

  private applySave(data: SaveData): void {
    this.snaps = data.snaps;
    this.applySnap({
      mission: data.mission,
      beat: data.beat,
      route: data.route,
      lights: data.lights,
      radio: data.radio,
      radioLocked: data.radioLocked,
      antenna: data.antenna,
      notebook: data.notebook,
      signRead: data.signRead,
      doors: data.doors,
      checkpoint: data.checkpoint,
      mhz: data.mhz,
      player: { x: data.player.x, z: data.player.z, yaw: data.player.yaw },
    });
    this.player.pitch = data.player.pitch;
    this.flashlight = data.flashlight;
    this.tuning = data.tuning && data.mission === "TUNE_SIGNAL";
    this.started = true;
    this.mode = data.mission === "COMPLETE" ? "complete" : "play";
  }

  private resetMonster(level: 1 | 2 | 3): void {
    this.brain = new MonsterBrain(PATROL);
    this.path = null;
    this.stuck = 0;
    if (level === 3) {
      this.placeMonster(72, 188);
      this.brain.state = "INVESTIGATE";
      this.brain.speed = SPEEDS.monsterInvestigate;
      this.brain.lastStimulus = this.point(INTERACT.antenna);
      this.brain.lastStimulusTime = this.time;
      this.brain.goal = { x: INTERACT.antenna.x, z: INTERACT.antenna.z };
      return;
    }
    this.placeMonster(MONSTER_HOME.x, MONSTER_HOME.z);
    this.brain.state = level === 1 ? "IDLE" : "PATROL";
    this.brain.speed = level === 1 ? 0 : SPEEDS.monsterPatrol;
    if (distance2(this.player.x, this.player.z, this.monster.x, this.monster.z) < 20) {
      this.placeMonster(MONSTER_HOME.x, MONSTER_HOME.z);
    }
  }
}
