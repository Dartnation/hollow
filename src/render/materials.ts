import { Color3, PBRMaterial, Scene } from "@babylonjs/core";
import { PALETTE } from "../sim/layout";

export function pbr(scene: Scene, name: string, hex: string, roughness: number, metallic = 0): PBRMaterial {
  const material = new PBRMaterial(name, scene);
  material.albedoColor = Color3.FromHexString(hex);
  material.roughness = roughness;
  material.metallic = metallic;
  material.environmentIntensity = 0.25;
  material.directIntensity = 1.15;
  return material;
}

export const COLORS = {
  shadow: Color3.FromHexString(PALETTE.shadow),
  pine: Color3.FromHexString(PALETTE.pine),
  pineDeep: Color3.FromHexString(PALETTE.pineDeep),
  moss: Color3.FromHexString(PALETTE.moss),
  fog: Color3.FromHexString(PALETTE.fogNight),
  wood: Color3.FromHexString(PALETTE.wood),
  woodDark: Color3.FromHexString(PALETTE.woodDark),
  warm: Color3.FromHexString(PALETTE.warm),
  signal: Color3.FromHexString(PALETTE.signal),
  moon: Color3.FromHexString(PALETTE.moon),
  dirt: Color3.FromHexString(PALETTE.dirt),
};
