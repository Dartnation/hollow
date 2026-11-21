import { DynamicTexture, Scene, Texture } from "@babylonjs/core";

function hash(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function paintBark(scene: Scene): Texture {
  const size = 256;
  const texture = new DynamicTexture("bark", { width: size, height: size * 2 }, scene, false);
  const ctx = texture.getContext();
  const image = ctx.getImageData(0, 0, size, size * 2);
  const data = image.data;
  for (let y = 0; y < size * 2; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = hash(x * 0.37, y * 0.11);
      const streak = Math.sin(x * 0.55 + n * 2) * 0.5 + 0.5;
      const crack = hash(Math.floor(x / 3), y * 0.4) > 0.86 ? 0.45 : 1;
      const moss = y > size * 1.55 ? hash(x, y) * 0.35 : 0;
      let r = 78 + streak * 36;
      let g = 58 + streak * 22;
      let b = 40 + streak * 14;
      r *= crack;
      g *= crack;
      b *= crack;
      g += moss * 40;
      b += moss * 18;
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  return texture;
}

function finish(texture: DynamicTexture, wrap: boolean): Texture {
  texture.hasAlpha = true;
  texture.update();
  const mode = wrap ? Texture.WRAP_ADDRESSMODE : Texture.CLAMP_ADDRESSMODE;
  texture.wrapU = mode;
  texture.wrapV = mode;
  return texture;
}

/** One spruce shelf: a jagged downward triangle, empty outside the needles. */
export function paintNeedles(scene: Scene): Texture {
  const w = 256;
  const h = 128;
  const texture = new DynamicTexture("needles", { width: w, height: h }, scene, false);
  const ctx = texture.getContext();
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const u = x / (w - 1);
      const v = y / (h - 1);
      const across = Math.abs(u - 0.5) * 2;
      const jag = 0.035 * Math.sin(u * 40);
      const edge = 0.18 + v * 0.82 + jag;
      const inside = across < edge && v > 0.08;
      const shade = inside ? 72 + (1 - v) * 48 + (hash(x, y) > 0.62 ? 22 : 0) : 0;
      const i = (y * w + x) * 4;
      data[i] = shade * 0.55;
      data[i + 1] = shade * 0.72;
      data[i + 2] = shade * 0.58;
      data[i + 3] = inside ? 255 : 0;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finish(texture, false);
}

/** One fern frond, stem at the bottom. */
export function paintFern(scene: Scene): Texture {
  const w = 128;
  const h = 256;
  const texture = new DynamicTexture("fern-tex", { width: w, height: h }, scene, false);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#2a4034";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h - 4);
  ctx.quadraticCurveTo(w * 0.42, h * 0.45, w * 0.5, 10);
  ctx.stroke();
  for (let i = 0; i < 14; i += 1) {
    const t = 0.15 + (i / 14) * 0.78;
    const y = h - t * (h - 16);
    const reach = 18 + Math.sin(t * Math.PI) * 28;
    ctx.strokeStyle = i % 2 === 0 ? "#24382e" : "#345244";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, y);
    ctx.quadraticCurveTo(w * 0.5 - reach * 0.4, y - 10, w * 0.5 - reach, y - 16);
    ctx.moveTo(w * 0.5, y);
    ctx.quadraticCurveTo(w * 0.5 + reach * 0.4, y - 8, w * 0.5 + reach, y - 14);
    ctx.stroke();
  }
  return finish(texture, false);
}

/** A small upright tuft, not a radial star. */
export function paintTuft(scene: Scene): Texture {
  const w = 96;
  const h = 160;
  const texture = new DynamicTexture("tuft", { width: w, height: h }, scene, false);
  const ctx = texture.getContext();
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 7; i += 1) {
    const x = w * (0.32 + (i % 4) * 0.1);
    const lean = (i - 3) * 6;
    ctx.fillStyle = i % 2 === 0 ? "#3d5a40" : "#2c4634";
    ctx.beginPath();
    ctx.moveTo(x - 3, h - 2);
    ctx.quadraticCurveTo(x + lean * 0.4, h * 0.45, x + lean, 18 + (i % 3) * 10);
    ctx.quadraticCurveTo(x + lean * 0.2, h * 0.5, x + 3, h - 2);
    ctx.fill();
  }
  return finish(texture, false);
}

/** Tileable close-up soil: needles, moss and damp earth. */
export function paintGroundDetail(scene: Scene): Texture {
  const size = 256;
  const texture = new DynamicTexture("ground-detail", { width: size, height: size }, scene, false);
  const ctx = texture.getContext();
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  const sample = (x: number, y: number) => hash(((x % size) + size) % size, ((y % size) + size) % size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = sample(x, y);
      const moss = sample(x * 0.37, y * 0.37) > 0.62;
      const needle = sample(x * 1.7, y * 0.4) > 0.78;
      let r = 42 + n * 18;
      let g = 36 + n * 12;
      let b = 28 + n * 8;
      if (moss) {
        r = 32 + n * 10;
        g = 48 + n * 16;
        b = 34 + n * 8;
      }
      if (needle) {
        r -= 8;
        g += 6;
        b -= 4;
      }
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  return texture;
}

export function paintBlade(scene: Scene): Texture {
  const w = 32;
  const h = 64;
  const texture = new DynamicTexture("blade", { width: w, height: h }, scene, false);
  texture.hasAlpha = true;
  const ctx = texture.getContext();
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let y = 0; y < h; y += 1) {
    const v = y / h;
    const half = (1 - v) * 0.42 + 0.04;
    for (let x = 0; x < w; x += 1) {
      const u = Math.abs(x / w - 0.5);
      const inside = u < half;
      const i = (y * w + x) * 4;
      const shade = 70 + (1 - v) * 50;
      data[i] = shade * 0.55;
      data[i + 1] = shade * 0.72;
      data[i + 2] = shade * 0.42;
      data[i + 3] = inside ? 255 : 0;
    }
  }
  ctx.putImageData(image, 0, 0);
  texture.update();
  return texture;
}
