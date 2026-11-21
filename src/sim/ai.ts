import { AI_TIMERS, SPEEDS, VISION } from "./balance";
import { angleDelta, distance2 } from "./rng";
import type { AiState, Sight, Vec2, Vec3 } from "./types";

export interface Heard {
  position: Vec3;
  loudness: number;
}

export interface BrainUpdate {
  caught: boolean;
}

/**
 * Vogteren. Sight writes lastKnownPlayerPosition.
 * Hearing writes lastStimulusPosition only.
 * A hidden player is never copied into memory.
 */
export class MonsterBrain {
  state: AiState = "IDLE";
  yaw = 0;
  yawTarget = 0;
  speed = 0;
  goal: Vec2 | null = null;
  lastKnown: Vec3 | null = null;
  lastKnownTime = -999;
  lastStimulus: Vec3 | null = null;
  lastStimulusTime = -999;
  lastLoudness = 0;

  private idle = AI_TIMERS.idle;
  private listen = 0;
  private search = 0;
  private lose = 0;
  private attack = 0;
  private waypoint = 0;
  private searchPoints: Vec2[] = [];
  private searchIndex = 0;

  constructor(private readonly patrol: readonly Vec2[]) {}

  update(dt: number, now: number, self: Vec2, sight: Sight | null, heard: Heard | null): BrainUpdate {
    this.fade(now);
    if (sight) return this.onSight(dt, now, self, sight);
    if (this.state === "CHASE" || this.state === "ATTACK") return this.onLostSight(dt, self);
    if (heard) this.onHeard(now, heard);
    this.tickState(dt, self);
    return { caught: false };
  }

  private fade(now: number): void {
    if (this.lastKnown && now - this.lastKnownTime > AI_TIMERS.memory) this.lastKnown = null;
    if (this.lastStimulus && now - this.lastStimulusTime > AI_TIMERS.memory) this.lastStimulus = null;
  }

  private onSight(dt: number, now: number, self: Vec2, sight: Sight): BrainUpdate {
    this.lastKnown = { ...sight.position };
    this.lastKnownTime = now;
    this.lose = VISION.loseGrace;
    this.face(self, sight.position.x, sight.position.z);
    this.goal = { x: sight.position.x, z: sight.position.z };
    if (sight.distance <= VISION.attackRange) {
      if (this.state !== "ATTACK") {
        this.state = "ATTACK";
        this.attack = VISION.attackWindup;
      } else {
        this.attack -= dt;
      }
      this.speed = 0;
      if (this.attack <= 0) return { caught: true };
      return { caught: false };
    }
    this.state = "CHASE";
    this.speed = SPEEDS.monsterChase;
    this.attack = 0;
    return { caught: false };
  }

  private onLostSight(dt: number, self: Vec2): BrainUpdate {
    this.lose -= dt;
    this.attack = 0;
    if (this.lastKnown) {
      this.goal = { x: this.lastKnown.x, z: this.lastKnown.z };
      this.face(self, this.lastKnown.x, this.lastKnown.z);
    }
    if (this.lose > 0) {
      this.state = "CHASE";
      this.speed = SPEEDS.monsterChase * 0.92;
      return { caught: false };
    }
    this.state = "LOST_TARGET";
    this.speed = SPEEDS.monsterInvestigate;
    return { caught: false };
  }

  private onHeard(now: number, heard: Heard): void {
    const previousTime = this.lastStimulusTime;
    const previous = this.lastStimulus;
    this.lastStimulus = { ...heard.position };
    this.lastStimulusTime = now;
    this.lastLoudness = heard.loudness;
    const shifted =
      !previous ||
      distance2(previous.x, previous.z, heard.position.x, heard.position.z) > 2.4 ||
      now - previousTime > 1.25;
    if (this.state === "INVESTIGATE") {
      this.goal = { x: heard.position.x, z: heard.position.z };
      return;
    }
    if (!shifted && this.state === "SUSPICIOUS") return;
    if (
      this.state === "IDLE" ||
      this.state === "PATROL" ||
      this.state === "RETURN" ||
      this.state === "SEARCH" ||
      this.state === "LOST_TARGET" ||
      this.state === "SUSPICIOUS"
    ) {
      this.state = "SUSPICIOUS";
      if (this.listen <= 0) {
        this.listen = heard.loudness >= AI_TIMERS.suspiciousLoudness ? AI_TIMERS.loudListen : AI_TIMERS.listen;
      }
    }
  }

  private tickState(dt: number, self: Vec2): void {
    switch (this.state) {
      case "IDLE":
        this.speed = 0;
        this.idle -= dt;
        if (this.idle <= 0) this.enterPatrol();
        break;
      case "SUSPICIOUS":
        this.speed = 0;
        if (this.lastStimulus) this.face(self, this.lastStimulus.x, this.lastStimulus.z);
        this.listen -= dt;
        if (this.listen <= 0) this.enterInvestigate();
        break;
      case "INVESTIGATE":
        this.speed = SPEEDS.monsterInvestigate;
        if (!this.goal && this.lastStimulus) this.goal = { x: this.lastStimulus.x, z: this.lastStimulus.z };
        if (this.arrived(self)) this.enterSearch(self);
        break;
      case "SEARCH":
        this.speed = SPEEDS.monsterSearch;
        this.search -= dt;
        if (this.searchPoints.length === 0) this.buildSearch(self);
        this.goal = this.searchPoints[this.searchIndex] ?? self;
        if (this.arrived(self)) this.searchIndex += 1;
        if (this.search <= 0 || this.searchIndex >= this.searchPoints.length) this.enterReturn(self);
        break;
      case "LOST_TARGET":
        this.speed = SPEEDS.monsterInvestigate;
        if (this.lastKnown) this.goal = { x: this.lastKnown.x, z: this.lastKnown.z };
        if (!this.goal || this.arrived(self)) this.enterSearch(self);
        break;
      case "RETURN":
        this.speed = SPEEDS.monsterPatrol;
        if (this.arrived(self)) this.enterPatrol();
        break;
      case "PATROL":
        this.speed = SPEEDS.monsterPatrol;
        this.goal = this.patrol[this.waypoint] ?? null;
        if (this.goal && this.arrived(self)) this.waypoint = (this.waypoint + 1) % this.patrol.length;
        break;
      case "CHASE":
      case "ATTACK":
        break;
      default:
        break;
    }
    if (this.goal && this.speed > 0) this.face(self, this.goal.x, this.goal.z);
  }

  private enterPatrol(): void {
    this.state = "PATROL";
    this.goal = this.patrol[this.waypoint] ?? null;
    this.speed = SPEEDS.monsterPatrol;
  }

  private enterInvestigate(): void {
    this.state = "INVESTIGATE";
    this.speed = SPEEDS.monsterInvestigate;
    if (this.lastStimulus) this.goal = { x: this.lastStimulus.x, z: this.lastStimulus.z };
  }

  private enterSearch(self: Vec2): void {
    this.state = "SEARCH";
    this.search = AI_TIMERS.search;
    this.searchIndex = 0;
    this.buildSearch(self);
    this.speed = SPEEDS.monsterSearch;
  }

  private enterReturn(self: Vec2): void {
    this.state = "RETURN";
    let best = this.patrol[0];
    let bestD = Infinity;
    for (const point of this.patrol) {
      const d = distance2(self.x, self.z, point.x, point.z);
      if (d < bestD) {
        bestD = d;
        best = point;
      }
    }
    this.goal = best ?? null;
    this.speed = SPEEDS.monsterPatrol;
  }

  private buildSearch(self: Vec2): void {
    const origin = this.lastKnown ?? this.lastStimulus ?? { x: self.x, y: 0, z: self.z };
    this.searchPoints = [
      { x: origin.x + 3.5, z: origin.z + 1.2 },
      { x: origin.x - 2.8, z: origin.z + 3.4 },
      { x: origin.x + 1.4, z: origin.z - 3.6 },
    ];
    this.searchIndex = 0;
  }

  private arrived(self: Vec2): boolean {
    if (!this.goal) return true;
    return distance2(self.x, self.z, this.goal.x, this.goal.z) <= AI_TIMERS.arrive;
  }

  private face(self: Vec2, x: number, z: number): void {
    this.yawTarget = Math.atan2(x - self.x, z - self.z);
  }

  turnToward(dt: number, rate: number): void {
    const delta = angleDelta(this.yaw, this.yawTarget);
    const step = Math.max(-rate * dt, Math.min(rate * dt, delta));
    this.yaw += step;
  }
}
