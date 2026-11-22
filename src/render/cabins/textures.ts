import { Color3, PBRMaterial, Scene, Texture } from "@babylonjs/core";

export interface CabinMaterials {
  plank: PBRMaterial;
  plankDark: PBRMaterial;
  floor: PBRMaterial;
  roof: PBRMaterial;
  stone: PBRMaterial;
  bark: PBRMaterial;
  metal: PBRMaterial;
  cloth: PBRMaterial;
  paper: PBRMaterial;
}

function image(scene: Scene, name: string, file: string, repeats: number, roughness: number, tint: string, metallic = 0): PBRMaterial {
  const material = new PBRMaterial(name, scene);
  const texture = new Texture(`/textures/cabins/${file}`, scene);
  texture.uScale = repeats;
  texture.vScale = repeats;
  material.albedoTexture = texture;
  material.albedoColor = Color3.FromHexString(tint);
  material.roughness = roughness;
  material.metallic = metallic;
  material.environmentIntensity = 0.22;
  return material;
}

/** CC0 1K maps. Each material gets its own texture so the repeat can differ. */
export function cabinMaterials(scene: Scene): CabinMaterials {
  return {
    plank: image(scene, "cabin-plank", "wood_planks.jpg", 2.4, 0.78, "#f2e6d4"),
    plankDark: image(scene, "cabin-plank-dark", "wood_planks.jpg", 2.2, 0.86, "#8a7360"),
    floor: image(scene, "cabin-floor", "wood_floor.jpg", 3.2, 0.72, "#efe2d0"),
    roof: image(scene, "cabin-roof", "roof_tiles.jpg", 3.4, 0.9, "#d9d3cb"),
    stone: image(scene, "cabin-stone", "concrete.jpg", 2.6, 0.94, "#b7b2a8"),
    bark: image(scene, "cabin-bark", "bark.jpg", 1.4, 0.92, "#c4b4a2"),
    metal: image(scene, "cabin-metal", "metal.jpg", 1.6, 0.48, "#d7d7d4", 0.72),
    cloth: image(scene, "cabin-cloth", "wood_floor.jpg", 1.2, 0.94, "#6a5348"),
    paper: image(scene, "cabin-paper", "wood_floor.jpg", 1, 0.88, "#e6d7bc"),
  };
}
