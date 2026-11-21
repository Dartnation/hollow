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
