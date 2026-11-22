import {
  Color3,
  Color4,
  DefaultRenderingPipeline,
  DirectionalLight,
  Engine,
  FreeCamera,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { BODY, SEED_DEFAULT } from "../sim/balance";
import { GameSim } from "../sim/game";
import { groundHeight } from "../sim/world";
import { EMPTY_INPUT, type Input } from "../sim/types";
import { AudioEngine } from "./audio";
import { Hud } from "./hud";
import { buildWorld } from "./worldView";

export async function mount(canvas: HTMLCanvasElement): Promise<void> {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get("seed")) || SEED_DEFAULT;
  const testMode = params.get("test") === "1";
  const showroom = params.get("showroom") === "1";
  const inspect = params.get("inspect") === "1" || showroom;
  const errors: string[] = [];
  window.addEventListener("error", (event) => errors.push(event.message));
  window.addEventListener("unhandledrejection", (event) => errors.push(String(event.reason)));
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    errors.push(args.map(String).join(" "));
    original(...args);
  };

  const engine = new Engine(canvas, true, { adaptToDeviceRatio: false, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new Scene(engine);
  scene.clearColor = inspect ? new Color4(0.58, 0.6, 0.58, 1) : new Color4(0.07, 0.09, 0.09, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = inspect ? 0.0015 : 0.02;
  scene.fogColor = inspect ? new Color3(0.58, 0.6, 0.58) : new Color3(0.06, 0.07, 0.065);
  scene.ambientColor = inspect ? new Color3(0.32, 0.33, 0.31) : new Color3(0.08, 0.09, 0.09);

  const camera = new FreeCamera("eye", new Vector3(2.4, 3, 8), scene);
  camera.fov = (78 * Math.PI) / 180;
  camera.minZ = 0.08;
  camera.maxZ = 320;
  camera.inputs.clear();

  const hemi = new HemisphericLight("sky", new Vector3(0.1, 1, 0.2), scene);
  hemi.intensity = inspect ? 0.9 : 0.22;
  hemi.diffuse = inspect ? new Color3(0.86, 0.87, 0.82) : new Color3(0.45, 0.55, 0.62);
  hemi.groundColor = new Color3(0.05, 0.06, 0.05);
  const moon = new DirectionalLight("moon", new Vector3(0.35, -1, 0.42), scene);
  moon.intensity = inspect ? 1.15 : 0.55;
  moon.diffuse = inspect ? new Color3(1, 0.97, 0.92) : new Color3(0.62, 0.72, 0.82);
  moon.position = new Vector3(-40, 80, -20);

  const sim = new GameSim(seed);
  const view = buildWorld(scene, camera, sim, moon);
  let pipeline: DefaultRenderingPipeline | null = null;
  try {
    pipeline = new DefaultRenderingPipeline("grade", true, scene, [camera]);
    pipeline.fxaaEnabled = true;
    pipeline.bloomEnabled = !inspect;
    pipeline.bloomThreshold = 0.72;
    pipeline.bloomWeight = 0.14;
    pipeline.bloomKernel = 48;
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.toneMappingEnabled = true;
    pipeline.imageProcessing.contrast = inspect ? 1.02 : 1.08;
    pipeline.imageProcessing.exposure = inspect ? 1.2 : 1.12;
    pipeline.imageProcessing.vignetteEnabled = !inspect;
    pipeline.imageProcessing.vignetteWeight = 0.55;
    pipeline.imageProcessing.vignetteStretch = 0.55;
    pipeline.grainEnabled = !inspect;
    pipeline.grain.intensity = 6;
  } catch (error) {
    errors.push(`Postprocessing udeladt: ${String(error)}`);
  }

  const audio = new AudioEngine();
  const hud = new Hud(sim, () => begin(), (value) => {
    view.exposure.value = value;
    if (pipeline) pipeline.imageProcessing.exposure = value;
  });
  hud.mount(document.body);

  const keys = new Set<string>();
  let bob = 0;
  let frames = 0;
  let fps = 0;
  let escapeHandled = false;
  const edges = { pause: false, journal: false, flashlight: false, crouch: false, interact: false };

  const begin = () => {
    sim.start();
    void audio.resume();
    if (showroom) {
      sim.placePlayer(0, -6);
      sim.lookAt(0, 10, 0.12);
    }
    if (!testMode) canvas.requestPointerLock();
  };

  canvas.addEventListener("click", () => {
    if (sim.started && !sim.paused && !sim.journal && sim.mode === "play" && !sim.tuning) canvas.requestPointerLock();
  });
  window.addEventListener("keydown", (event) => {
    if (event.code === "Tab") event.preventDefault();
    if (event.code === "Escape") {
      escapeHandled = true;
      if (sim.journal) sim.journal = false;
      else if (sim.tuning) sim.tuning = false;
      else if (sim.started) sim.paused = !sim.paused;
      return;
    }
    keys.add(event.code);
    if (event.code === "KeyE") edges.interact = true;
    if (event.code === "KeyF") edges.flashlight = true;
    if (event.code === "KeyC") edges.crouch = true;
    if (event.code === "Tab") edges.journal = true;
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== canvas || sim.paused || sim.journal || !sim.started) return;
    lookX += event.movementX;
    lookY += event.movementY;
  });
  window.addEventListener("wheel", (event) => {
    if (sim.tuning) tune += event.deltaY > 0 ? 0.08 : -0.08;
  }, { passive: true });
  window.addEventListener("resize", () => engine.resize());
  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement && sim.started && sim.mode === "play" && !sim.paused && !sim.journal && !escapeHandled) {
      sim.paused = true;
    }
    escapeHandled = false;
  });

  let lookX = 0;
  let lookY = 0;
  let tune = 0;
  let titleYaw = 0.15;

  audio.load().catch((error: unknown) => errors.push(`Lyd: ${String(error)}`));

  const readInput = (): Input => {
    const forward = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
    const strafe = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
    const input: Input = {
      ...EMPTY_INPUT,
      forward,
      strafe,
      run: keys.has("ShiftLeft") || keys.has("ShiftRight"),
      crouchHold: keys.has("ControlLeft") || keys.has("ControlRight"),
      crouchToggle: edges.crouch,
      yawDelta: lookX * 0.0022,
      pitchDelta: -lookY * 0.002,
      flashlightToggle: edges.flashlight,
      interactPressed: edges.interact,
      interactHeld: keys.has("KeyE"),
      tuneDelta: tune + (keys.has("ArrowRight") ? 0.04 : 0) - (keys.has("ArrowLeft") ? 0.04 : 0),
      journalToggle: edges.journal,
      pauseToggle: edges.pause,
    };
    lookX = 0;
    lookY = 0;
    tune = 0;
    edges.crouch = false;
    edges.flashlight = false;
    edges.interact = false;
    edges.journal = false;
    edges.pause = false;
    return input;
  };

  engine.runRenderLoop(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    const cues = sim.started ? sim.step(dt, readInput()) : [];
    const eye = (sim.crouching ? BODY.crouchEye : BODY.eye) + Math.sin(bob) * (sim.player.speed > 2.5 ? 0.018 : sim.player.speed > 0.2 ? 0.008 : 0);
    if (sim.player.speed > 0.2) bob += dt * sim.player.speed * 2.4;
    if (!sim.started) {
      titleYaw += dt * 0.05;
      camera.position.set(1.2, groundHeight(1.2, 2.4) + 1.75, 2.4);
      camera.setTarget(new Vector3(Math.sin(titleYaw) * 8, 2.2, 46));
    } else {
      const cos = Math.cos(sim.player.pitch);
      camera.position.set(sim.player.x, sim.player.y + eye, sim.player.z);
      camera.setTarget(
        new Vector3(
          sim.player.x + Math.sin(sim.player.yaw) * cos,
          sim.player.y + eye + Math.sin(sim.player.pitch),
          sim.player.z + Math.cos(sim.player.yaw) * cos,
        ),
      );
    }
    view.update(sim, dt);
    audio.update(sim, cues);
    hud.update();
    scene.render();
    frames += 1;
    fps = dt > 0 ? fps * 0.95 + (1 / dt) * 0.05 : fps;
  });

  await Promise.all([
    view.showroomReady.catch((error: unknown) => {
      errors.push(`Showroom: ${String(error)}`);
    }),
    view.forestReady.catch((error: unknown) => {
      errors.push(`Forest: ${String(error)}`);
    }),
  ]);

  if (params.get("autostart") === "1") begin();

  if (testMode) {
    window.__HOLLOW__ = {
      ready: true,
      seed,
      errors,
      start: begin,
      step: (next) => {
        sim.step(next);
      },
      placePlayer: (x, z, yaw) => sim.placePlayer(x, z, yaw),
      placeMonster: (x, z) => sim.placeMonster(x, z),
      lookAt: (x, z, pitch) => sim.lookAt(x, z, pitch),
      interact: () => sim.interact(),
      hold: (seconds) => sim.hold(seconds),
      setFrequency: (mhz) => sim.setFrequency(mhz),
      setHudVisible: (visible) => hud.setVisible(visible),
      setFlashlight: (on) => {
        sim.flashlight = on;
      },
      stats: () => ({
        fps,
        activeMeshes: scene.getActiveMeshes().length,
        triangles: Math.round(scene.getActiveIndices() / 3),
      }),
      kill: () => sim.kill(),
      save: () => localStorage.setItem("hollow-v1-save", sim.serialize()),
      load: () => {
        const raw = localStorage.getItem("hollow-v1-save");
        return raw ? sim.load(raw) : false;
      },
      fps: () => fps,
      snapshot: () => {
        const snap = sim.snapshot();
        return {
          mission: snap.mission,
          beat: snap.beat,
          route: snap.route,
          checkpoint: snap.checkpoint,
          lights: snap.lights,
          radio: snap.radio,
          radioLocked: snap.radioLocked,
          antenna: snap.antenna,
          notebook: snap.notebook,
          doors: snap.doors,
          player: {
            x: snap.player.x,
            y: snap.player.y,
            z: snap.player.z,
            yaw: snap.player.yaw,
            crouching: snap.player.crouching,
            flashlight: snap.player.flashlight,
          },
          monster: snap.monster,
          audio: { loaded: audio.loaded, context: audio.context.state },
          subtitle: snap.subtitle,
          prompt: snap.prompt,
        };
      },
    };
  }
}
