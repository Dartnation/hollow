import {
  Color3,
  Color4,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  PointLight,
  Scene,
  ShadowGenerator,
  SpotLight,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Camera,
  type DirectionalLight,
} from "@babylonjs/core";
import type { GameSim } from "../sim/game";
import { BRIDGE, INTERACT, LANDMARKS, PALETTE, SHED } from "../sim/layout";
import { bridgeHeight, groundHeight, terrainHeight } from "../sim/world";
import { createForest } from "./forest";
import { buildShowroom } from "./forest/showroom";
import { pbr } from "./materials";

export interface WorldView {
  flashlight: SpotLight;
  exposure: { value: number };
  update(sim: GameSim, dt: number): void;
  setHudLit(on: boolean): void;
}

export function buildWorld(scene: Scene, camera: Camera, sim: GameSim, moon: DirectionalLight): WorldView {
  const floorY = groundHeight(LANDMARKS.hut.x, LANDMARKS.hut.z);
  const wood = pbr(scene, "wood", PALETTE.wood, 0.78, 0.02);
  const woodDark = pbr(scene, "woodDark", PALETTE.woodDark, 0.84, 0.03);
  const stone = pbr(scene, "stone", "#5d645f", 0.9, 0.04);
  const metal = pbr(scene, "metal", "#3c403c", 0.42, 0.72);
  const glass = pbr(scene, "glass", "#c9b08a", 0.18, 0);
  glass.alpha = 0.22;
  glass.emissiveColor = Color3.FromHexString(PALETTE.warm);
  glass.emissiveIntensity = 0.65;
  const diodeMat = pbr(scene, "diode", PALETTE.signal, 0.35, 0);
  diodeMat.emissiveColor = Color3.FromHexString("#ff4a3a");
  diodeMat.emissiveIntensity = 0;
  const lampMat = pbr(scene, "lamp", "#d7e2dc", 0.4, 0);
  lampMat.emissiveColor = Color3.FromHexString("#d5ecdf");
  lampMat.emissiveIntensity = 0;

  const showroom = new URLSearchParams(location.search).get("showroom") === "1";
  const forest = showroom ? null : createForest(scene, sim, moon);
  if (showroom) buildShowroom(scene);
  buildWater(scene);
  buildBridge(scene, woodDark);
  buildCar(scene, metal);
  buildSigns(scene, woodDark);
  const doors = buildCabin(scene, floorY, wood, woodDark, stone, glass, diodeMat);
  const shed = buildShed(scene, woodDark, metal, lampMat);
  buildPassage(scene, stone, lampMat);
  const monster = buildMonster(scene);
  if (showroom) {
    monster.root.setEnabled(false);
    scene.getMeshByName("car")?.setEnabled(false);
    scene.getMeshByName("car-cabin")?.setEnabled(false);
  }
  const lights = buildLights(scene, floorY, camera);
  if (forest) forest.useShadows(lights.shadows);
  if (!showroom) buildRain(scene, camera);

  const exposure = { value: 1.12 };
  let phase = 0;

  return {
    flashlight: lights.flashlight,
    exposure,
    setHudLit() {},
    update(simNow, dt) {
      phase += dt;
      const open = simNow.mission.doors;
      swing(doors.front, open.front ? -1.35 : 0, dt);
      swing(doors.side, open.side ? 1.35 : 0, dt);
      swing(shed.door, open.shed ? -1.25 : 0, dt);
      const lit = simNow.mission.lights;
      glass.emissiveIntensity = lit ? 0.85 : 0.02;
      lights.interior.intensity = lit ? 2.4 : 0;
      lights.porch.intensity = lit ? 8 : 0;
      lights.securityA.intensity = lit ? 2.6 : 0;
      lights.securityB.intensity = lit ? 2.2 : 0;
      const diode = simNow.mission.radio ? 2.8 : 0;
      diodeMat.emissiveIntensity = diode;
      lights.diode.intensity = simNow.mission.radio ? 1.6 : 0;
      lampMat.emissiveIntensity = simNow.mission.state === "ESCAPE" || simNow.mission.state === "COMPLETE" ? 1.4 : 0.05;
      lights.passage.intensity = lampMat.emissiveIntensity > 0.2 ? 4 : 0;
      shed.rotor.rotation.z += simNow.mission.radio ? dt * 6 : 0;
      poseMonster(monster, simNow, phase, dt);
      forest?.update(camera.position, phase);
      const forward = camera.getDirection(Vector3.Forward());
      lights.flashlight.position.copyFrom(camera.position);
      lights.flashlight.direction.copyFrom(forward);
      lights.flashlight.setEnabled(simNow.flashlight && simNow.started);
    },
  };
}

function buildWater(scene: Scene): void {
  const material = pbr(scene, "water", PALETTE.water, 0.18, 0.04);
  material.alpha = 0.72;
  const points = [
    [48, 28],
    [62, 52],
    [78, 72],
    [94, 96],
  ];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    const mesh = MeshBuilder.CreateBox(`water-${i}`, { width: 7.5, height: 0.08, depth: Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!) }, scene);
    mesh.position.set((a[0]! + b[0]!) / 2, terrainHeight((a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2) + 0.05, (a[1]! + b[1]!) / 2);
    mesh.rotation.y = Math.atan2(b[0]! - a[0]!, b[1]! - a[1]!);
    mesh.material = material;
  }
}

function buildBridge(scene: Scene, wood: ReturnType<typeof pbr>): void {
  const dx = BRIDGE.bx - BRIDGE.ax;
  const dz = BRIDGE.bz - BRIDGE.az;
  const length = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const steps = Math.floor(length / 0.72);
  const planks: Mesh[] = [];
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = BRIDGE.ax + dx * t;
    const z = BRIDGE.az + dz * t;
    const deck = bridgeHeight(x, z);
    if (deck === null) continue;
    const plank = MeshBuilder.CreateBox(`plank-${i}`, { width: 3.15, height: 0.08, depth: 0.42 }, scene);
    plank.position.set(x, deck, z);
    plank.rotation.y = yaw;
    planks.push(plank);
  }
  const merged = Mesh.MergeMeshes(planks, true, true, undefined, false, true);
  if (merged) merged.material = wood;
  for (const side of [-1.45, 1.45]) {
    const rail = MeshBuilder.CreateBox(`rail-${side}`, { width: 0.08, height: 0.08, depth: length }, scene);
    const x = (BRIDGE.ax + BRIDGE.bx) / 2 + Math.cos(yaw) * side;
    const z = (BRIDGE.az + BRIDGE.bz) / 2 - Math.sin(yaw) * side;
    const y = bridgeHeight((BRIDGE.ax + BRIDGE.bx) / 2, (BRIDGE.az + BRIDGE.bz) / 2) ?? 1;
    rail.position.set(x, y + 0.85, z);
    rail.rotation.y = yaw;
    rail.material = wood;
  }
}

function buildCar(scene: Scene, metal: ReturnType<typeof pbr>): void {
  const body = MeshBuilder.CreateBox("car", { width: 1.7, height: 0.7, depth: 3.4 }, scene);
  body.position.set(0.05, groundHeight(0, 0) + 0.62, 0.2);
  body.material = metal;
  const cabin = MeshBuilder.CreateBox("car-cabin", { width: 1.5, height: 0.55, depth: 1.5 }, scene);
  cabin.position.set(0.05, groundHeight(0, 0) + 1.15, -0.15);
  const glass = pbr(scene, "car-glass", "#9eb0b8", 0.15, 0.1);
  glass.alpha = 0.35;
  cabin.material = glass;
  const head = new SpotLight("headlights", new Vector3(0, groundHeight(0, 0) + 0.7, 1.6), new Vector3(0, -0.15, 1), Math.PI / 3.4, 8, scene);
  head.intensity = 3.4;
  head.diffuse = Color3.FromHexString("#d5e4ef");
  head.range = 28;
}

function buildSigns(scene: Scene, wood: ReturnType<typeof pbr>): void {
  sign(scene, wood, 23.2, 43.4, "SKOVTJENESTEN", "ANLÆG LUKKET");
  sign(scene, wood, 29.6, 46.8, "BRO", "KORT · HØJLYDT");
  sign(scene, wood, 20.6, 49.4, "SKRÆNT", "LANG · SKJULT");
}

function sign(scene: Scene, wood: ReturnType<typeof pbr>, x: number, z: number, title: string, subtitle: string): void {
  const y = groundHeight(x, z);
  const post = MeshBuilder.CreateCylinder(`post-${title}`, { height: 1.8, diameter: 0.12, tessellation: 6 }, scene);
  post.position.set(x, y + 0.9, z);
  post.material = wood;
  const board = MeshBuilder.CreatePlane(`board-${title}`, { width: 1.5, height: 0.72 }, scene);
  board.position.set(x, y + 1.55, z + 0.02);
  const texture = new DynamicTexture(`tex-${title}`, { width: 512, height: 256 }, scene, true);
  texture.drawText(title, 36, 110, "bold 54px Georgia", "#f0e2cc", "#241c16", true, false);
  texture.drawText(subtitle, 36, 180, "28px Georgia", "#d7c3a4", null, true, true);
  const material = new StandardMaterial(`sign-mat-${title}`, scene);
  material.diffuseTexture = texture;
  material.emissiveTexture = texture;
  material.emissiveColor = new Color3(0.25, 0.22, 0.18);
  material.specularColor = Color3.Black();
  board.material = material;
}

function buildCabin(
  scene: Scene,
  floorY: number,
  wood: ReturnType<typeof pbr>,
  woodDark: ReturnType<typeof pbr>,
  stone: ReturnType<typeof pbr>,
  glass: ReturnType<typeof pbr>,
  diodeMat: ReturnType<typeof pbr>,
): { front: TransformNode; side: TransformNode } {
  const foundation = MeshBuilder.CreateBox("foundation", { width: 9.4, height: 0.28, depth: 8.4 }, scene);
  foundation.position.set(110.5, floorY + 0.08, 145);
  foundation.material = stone;
  wall(scene, woodDark, 107.5, floorY + 1.45, 141.02, 3, 2.7, 0.28);
  wall(scene, woodDark, 113, floorY + 1.45, 141.02, 4, 2.7, 0.28);
  wall(scene, woodDark, 110.5, floorY + 1.45, 149, 9, 2.7, 0.28);
  wall(scene, woodDark, 106.16, floorY + 1.45, 145, 0.28, 2.7, 8);
  wall(scene, woodDark, 115, floorY + 1.45, 142.5, 0.28, 2.7, 3);
  wall(scene, woodDark, 115, floorY + 1.45, 147.5, 0.28, 2.7, 3);
  const floor = MeshBuilder.CreateBox("floor", { width: 8.4, height: 0.08, depth: 7.2 }, scene);
  floor.position.set(110.5, floorY + 0.08, 145);
  floor.material = wood;
  windowPane(scene, glass, 112.9, floorY + 1.65, 140.9, 1.5, 1.05);
  windowPane(scene, glass, 106.2, floorY + 1.65, 146.8, 0.12, 1.05);
  roof(scene, woodDark, floorY);
  porch(scene, wood, woodDark, floorY);
  const front = door(scene, wood, 109, floorY, 141.05, 2, 2.35, 0.08);
  const side = door(scene, wood, 115.02, floorY, 144, 0.12, 2.2, 2);
  furniture(scene, wood, woodDark, floorY, diodeMat);
  return { front, side };
}

function wall(scene: Scene, material: ReturnType<typeof pbr>, x: number, y: number, z: number, w: number, h: number, d: number): void {
  const mesh = MeshBuilder.CreateBox("wall", { width: w, height: h, depth: d }, scene);
  mesh.position.set(x, y, z);
  mesh.material = material;
  mesh.receiveShadows = true;
}

function windowPane(scene: Scene, material: ReturnType<typeof pbr>, x: number, y: number, z: number, w: number, h: number): void {
  const pane = MeshBuilder.CreatePlane("window", { width: w, height: h }, scene);
  pane.position.set(x, y, z);
  if (w < 0.3) pane.rotation.y = Math.PI / 2;
  pane.material = material;
}

function roof(scene: Scene, material: ReturnType<typeof pbr>, floorY: number): void {
  const left = MeshBuilder.CreateBox("roof-l", { width: 5.4, height: 0.16, depth: 10.2 }, scene);
  left.position.set(108.15, floorY + 3.55, 145);
  left.rotation.z = 0.42;
  left.material = material;
  const right = MeshBuilder.CreateBox("roof-r", { width: 5.4, height: 0.16, depth: 10.2 }, scene);
  right.position.set(112.85, floorY + 3.55, 145);
  right.rotation.z = -0.42;
  right.material = material;
  const chimney = MeshBuilder.CreateBox("chimney", { width: 0.55, height: 1.3, depth: 0.55 }, scene);
  chimney.position.set(113.4, floorY + 4.15, 147.2);
  chimney.material = pbr(scene, "brick", "#4a4038", 0.9);
}

function porch(scene: Scene, wood: ReturnType<typeof pbr>, dark: ReturnType<typeof pbr>, floorY: number): void {
  const deck = MeshBuilder.CreateBox("porch", { width: 7.2, height: 0.12, depth: 8.6 }, scene);
  deck.position.set(106.6, floorY + 0.12, 153.6);
  deck.material = wood;
  const cover = MeshBuilder.CreateBox("porch-roof", { width: 7.4, height: 0.1, depth: 8.8 }, scene);
  cover.position.set(106.6, floorY + 2.55, 153.6);
  cover.material = dark;
  for (const [x, z] of [
    [103.6, 149.6],
    [109.6, 149.6],
    [103.6, 157.6],
    [109.6, 157.6],
  ] as const) {
    const post = MeshBuilder.CreateCylinder("porch-post", { height: 2.4, diameter: 0.16, tessellation: 6 }, scene);
    post.position.set(x, floorY + 1.25, z);
    post.material = dark;
  }
  const crateA = MeshBuilder.CreateBox("crate-a", { width: 1.9, height: 1.15, depth: 1.4 }, scene);
  crateA.position.set(105.35, floorY + 0.7, 153.9);
  crateA.material = wood;
  const crateB = MeshBuilder.CreateBox("crate-b", { width: 1.8, height: 1.25, depth: 1.6 }, scene);
  crateB.position.set(107.5, floorY + 0.75, 156.2);
  crateB.material = dark;
}

function door(scene: Scene, material: ReturnType<typeof pbr>, x: number, floorY: number, z: number, width: number, height: number, depth: number): TransformNode {
  const pivot = new TransformNode(`door-pivot-${x}-${z}`, scene);
  pivot.position.set(x, floorY, z);
  const leaf = MeshBuilder.CreateBox(`door-${x}`, { width: width || 0.12, height, depth: depth || 0.08 }, scene);
  leaf.material = material;
  leaf.parent = pivot;
  leaf.position.x = width > 0.4 ? width / 2 : 0;
  leaf.position.y = height / 2;
  leaf.position.z = depth > 0.4 ? depth / 2 : 0;
  return pivot;
}

function furniture(scene: Scene, wood: ReturnType<typeof pbr>, dark: ReturnType<typeof pbr>, floorY: number, diodeMat: ReturnType<typeof pbr>): void {
  const table = MeshBuilder.CreateBox("table", { width: 1.9, height: 0.74, depth: 0.95 }, scene);
  table.position.set(113.2, floorY + 0.45, 144);
  table.material = wood;
  const radio = MeshBuilder.CreateBox("radio", { width: 0.62, height: 0.28, depth: 0.34 }, scene);
  radio.position.set(INTERACT.radio.x, floorY + 0.96, INTERACT.radio.z);
  radio.material = dark;
  const diode = MeshBuilder.CreateSphere("diode", { diameter: 0.06, segments: 6 }, scene);
  diode.position.set(INTERACT.radio.x + 0.22, floorY + 1.08, INTERACT.radio.z + 0.12);
  diode.material = diodeMat;
  const book = MeshBuilder.CreateBox("notebook", { width: 0.28, height: 0.04, depth: 0.36 }, scene);
  book.position.set(INTERACT.notebook.x, floorY + 0.86, INTERACT.notebook.z);
  book.material = pbr(scene, "paper", "#d8c7a4", 0.8);
  const panel = MeshBuilder.CreateBox("panel", { width: 0.12, height: 0.7, depth: 0.5 }, scene);
  panel.position.set(INTERACT.panel.x, floorY + 1.35, INTERACT.panel.z);
  panel.material = pbr(scene, "panel", "#2c2824", 0.55, 0.4);
  const bed = MeshBuilder.CreateBox("bed", { width: 2.1, height: 0.45, depth: 1.15 }, scene);
  bed.position.set(107.7, floorY + 0.35, 147.3);
  bed.material = pbr(scene, "blanket", "#3e2e2a", 0.9);
  const stove = MeshBuilder.CreateBox("stove", { width: 0.8, height: 0.9, depth: 0.7 }, scene);
  stove.position.set(113.5, floorY + 0.55, 147.4);
  stove.material = pbr(scene, "iron", "#2a2c2e", 0.4, 0.8);
}

function buildShed(
  scene: Scene,
  wood: ReturnType<typeof pbr>,
  metal: ReturnType<typeof pbr>,
  lamp: ReturnType<typeof pbr>,
): { rotor: Mesh; door: TransformNode } {
  const y = groundHeight(LANDMARKS.shed.x, LANDMARKS.shed.z);
  const body = MeshBuilder.CreateBox("shed", { width: 5, height: 2.3, depth: 4.2 }, scene);
  body.position.set(140.9, y + 1.2, 155.3);
  body.material = metal;
  const roof = MeshBuilder.CreateBox("shed-roof", { width: 5.4, height: 0.12, depth: 4.6 }, scene);
  roof.position.set(140.9, y + 2.45, 155.3);
  roof.rotation.x = 0.08;
  roof.material = wood;
  const mast = MeshBuilder.CreateCylinder("antenna", { height: 5.2, diameter: 0.08, tessellation: 6 }, scene);
  mast.position.set(INTERACT.antenna.x, y + 2.6, INTERACT.antenna.z);
  mast.material = metal;
  const bulb = MeshBuilder.CreateSphere("antenna-lamp", { diameter: 0.18, segments: 8 }, scene);
  bulb.position.set(INTERACT.antenna.x, y + 5.2, INTERACT.antenna.z);
  bulb.material = lamp;
  const rotor = MeshBuilder.CreateBox("generator-wheel", { width: 0.5, height: 0.5, depth: 0.08 }, scene);
  rotor.position.set(140.2, y + 0.8, 154.2);
  rotor.material = metal;
  const shedDoor = door(scene, wood, SHED.minX, y, 154, 0.1, 2.05, 2);
  return { rotor, door: shedDoor };
}

function buildPassage(scene: Scene, stone: ReturnType<typeof pbr>, lamp: ReturnType<typeof pbr>): void {
  const y = groundHeight(LANDMARKS.passage.x, LANDMARKS.passage.z);
  for (const side of [-2.2, 2.2]) {
    const pillar = MeshBuilder.CreateCylinder("pillar", { height: 3.4, diameter: 0.7, tessellation: 7 }, scene);
    pillar.position.set(LANDMARKS.passage.x + side, y + 1.7, LANDMARKS.passage.z);
    pillar.material = stone;
  }
  const lampMesh = MeshBuilder.CreateSphere("passage-lamp", { diameter: 0.28, segments: 8 }, scene);
  lampMesh.position.set(LANDMARKS.passage.x, y + 3.1, LANDMARKS.passage.z);
  lampMesh.material = lamp;
}

interface MonsterRig {
  root: TransformNode;
  hips: TransformNode;
  torso: TransformNode;
  head: TransformNode;
  armL: TransformNode;
  armR: TransformNode;
  legL: TransformNode;
  legR: TransformNode;
}

function buildMonster(scene: Scene): MonsterRig {
  const hide = pbr(scene, "warden", "#161c1b", 0.58, 0.06);
  const root = new TransformNode("warden", scene);
  const hips = bone(scene, root, 0, 1.05, 0);
  const torso = bone(scene, hips, 0, 0.38, 0);
  const head = bone(scene, torso, 0, 0.55, 0.02);
  const armL = bone(scene, torso, -0.34, 0.32, 0);
  const armR = bone(scene, torso, 0.34, 0.32, 0);
  const legL = bone(scene, hips, -0.14, 0, 0);
  const legR = bone(scene, hips, 0.14, 0, 0);
  limb(scene, torso, hide, 0.42, 0.7, 0.28, 0, 0.15, 0);
  limb(scene, head, hide, 0.26, 0.32, 0.28, 0, 0.12, 0.02);
  const eye = MeshBuilder.CreateBox("warden-eye", { width: 0.16, height: 0.028, depth: 0.02 }, scene);
  eye.parent = head;
  eye.position.set(0, 0.16, 0.16);
  const eyeMat = new StandardMaterial("warden-eye-mat", scene);
  eyeMat.emissiveColor = Color3.FromHexString("#8a3a34");
  eyeMat.diffuseColor = Color3.Black();
  eye.material = eyeMat;
  limb(scene, armL, hide, 0.1, 0.95, 0.1, 0, -0.48, 0.08);
  limb(scene, armR, hide, 0.1, 0.95, 0.1, 0, -0.48, 0.08);
  limb(scene, legL, hide, 0.12, 1.05, 0.12, 0, -0.52, 0);
  limb(scene, legR, hide, 0.12, 1.05, 0.12, 0, -0.52, 0);
  return { root, hips, torso, head, armL, armR, legL, legR };
}

function bone(scene: Scene, parent: TransformNode, x: number, y: number, z: number): TransformNode {
  const node = new TransformNode("bone", scene);
  node.parent = parent;
  node.position.set(x, y, z);
  return node;
}

function limb(scene: Scene, parent: TransformNode, material: ReturnType<typeof pbr>, w: number, h: number, d: number, x: number, y: number, z: number): void {
  const mesh = MeshBuilder.CreateBox("limb", { width: w, height: h, depth: d }, scene);
  mesh.parent = parent;
  mesh.position.set(x, y, z);
  mesh.material = material;
}

function poseMonster(rig: MonsterRig, sim: GameSim, phase: number, dt: number): void {
  const moving = sim.monster.speed > 0.25;
  const swing = moving ? Math.sin(phase * (sim.brain.state === "CHASE" ? 11 : 7)) : 0;
  rig.root.position.set(sim.monster.x, sim.monster.y, sim.monster.z);
  const turn = sim.monster.yaw - rig.root.rotation.y;
  rig.root.rotation.y += Math.max(-dt * 6, Math.min(dt * 6, normalize(turn)));
  rig.legL.rotation.x = swing * 0.75;
  rig.legR.rotation.x = -swing * 0.75;
  rig.armL.rotation.x = -swing * 0.6;
  rig.armR.rotation.x = swing * 0.6;
  rig.hips.position.y = 1.05 + (moving ? Math.abs(Math.sin(phase * 7)) * 0.06 : Math.sin(phase * 1.6) * 0.015);
  const listen = sim.brain.state === "SUSPICIOUS" || sim.brain.state === "SEARCH";
  rig.head.rotation.x = listen ? 0.28 : sim.brain.state === "ATTACK" ? 0.15 : 0.05;
  rig.head.rotation.z = listen ? Math.sin(phase * 1.3) * 0.12 : 0;
  rig.torso.rotation.x = sim.brain.state === "ATTACK" ? 0.55 : sim.brain.state === "CHASE" ? 0.18 : 0;
}

function buildLights(scene: Scene, floorY: number, camera: Camera): {
  interior: PointLight;
  porch: SpotLight;
  securityA: SpotLight;
  securityB: SpotLight;
  diode: PointLight;
  passage: PointLight;
  flashlight: SpotLight;
  shadows: ShadowGenerator;
} {
  const warm = Color3.FromHexString(PALETTE.warm);
  const interior = new PointLight("interior", new Vector3(110.5, floorY + 2.2, 145), scene);
  interior.diffuse = warm;
  interior.range = 9;
  const porch = new SpotLight("porch", new Vector3(106.5, floorY + 2.4, 153), new Vector3(0, -1, 0.2), Math.PI / 2.4, 4, scene);
  porch.diffuse = warm;
  porch.range = 26;
  const securityA = new SpotLight("sec-a", new Vector3(107, floorY + 3.1, 140.2), new Vector3(-0.2, -0.6, -1), Math.PI / 3, 6, scene);
  const securityB = new SpotLight("sec-b", new Vector3(114, floorY + 3.1, 140.2), new Vector3(0.3, -0.6, -1), Math.PI / 3, 6, scene);
  securityA.diffuse = warm;
  securityB.diffuse = warm;
  const diode = new PointLight("diode", new Vector3(INTERACT.radio.x, floorY + 1.15, INTERACT.radio.z), scene);
  diode.diffuse = Color3.FromHexString("#ff5a48");
  diode.range = 3.2;
  const passageY = groundHeight(LANDMARKS.passage.x, LANDMARKS.passage.z);
  const passage = new PointLight("passage", new Vector3(LANDMARKS.passage.x, passageY + 3.1, LANDMARKS.passage.z), scene);
  passage.diffuse = Color3.FromHexString("#d5ecdf");
  passage.range = 14;
  const flashlight = new SpotLight("flashlight", Vector3.Zero(), new Vector3(0, 0, 1), 0.42, 28, scene);
  flashlight.diffuse = Color3.FromHexString("#ffe6c2");
  flashlight.intensity = 22;
  flashlight.range = 18;
  flashlight.shadowMinZ = 0.15;
  flashlight.shadowMaxZ = 18;
  const shadows = new ShadowGenerator(1024, flashlight);
  shadows.usePercentageCloserFiltering = true;
  shadows.bias = 0.002;
  for (const mesh of scene.meshes) {
    if (mesh.name === "limb" || mesh.name === "car" || mesh.name.startsWith("wall")) shadows.addShadowCaster(mesh, false);
    if (!mesh.isAnInstance) mesh.receiveShadows = true;
  }
  return { interior, porch, securityA, securityB, diode, passage, flashlight, shadows };
}

function buildRain(scene: Scene, camera: Camera): void {
  const anchor = MeshBuilder.CreateBox("rain-anchor", { size: 0.2 }, scene);
  anchor.parent = camera;
  anchor.isVisible = false;
  const texture = new DynamicTexture("drop", { width: 32, height: 32 }, scene, true);
  const ctx = texture.getContext();
  const gradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
  gradient.addColorStop(0, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  texture.update();
  const rain = new ParticleSystem("rain", 1400, scene);
  rain.particleTexture = texture;
  rain.emitter = anchor;
  rain.minEmitBox = new Vector3(-16, 7, -16);
  rain.maxEmitBox = new Vector3(16, 11, 16);
  rain.direction1 = new Vector3(0.4, -14, 0.15);
  rain.direction2 = new Vector3(-0.1, -11, 0.05);
  rain.minLifeTime = 0.45;
  rain.maxLifeTime = 0.9;
  rain.minSize = 0.02;
  rain.maxSize = 0.06;
  rain.emitRate = 700;
  rain.color1 = new Color4(0.75, 0.8, 0.82, 0.28);
  rain.color2 = new Color4(0.62, 0.68, 0.7, 0.12);
  rain.gravity = new Vector3(0, -2, 0);
  rain.minEmitPower = 1;
  rain.maxEmitPower = 1.4;
  rain.start();
}

function swing(node: TransformNode, target: number, dt: number): void {
  node.rotation.y += (target - node.rotation.y) * Math.min(1, dt * 8);
}

function normalize(angle: number): number {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
