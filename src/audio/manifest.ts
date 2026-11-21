export const AUDIO_FILES = {
  ambience: "/audio/ambience.mp3",
  rain: "/audio/rain.mp3",
  footDirt: "/audio/footstep-dirt.mp3",
  footWood: "/audio/footstep-wood.mp3",
  door: "/audio/door.mp3",
  generator: "/audio/generator.mp3",
  static: "/audio/radio-static.mp3",
  tone: "/audio/radio-tone.mp3",
  monster: "/audio/monster.mp3",
  click: "/audio/click.mp3",
} as const;

export type AudioKey = keyof typeof AUDIO_FILES;
