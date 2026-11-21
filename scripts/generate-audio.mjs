import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";

const out = "public/audio";
mkdirSync(out, { recursive: true });

const jobs = [
  [
    "ambience.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=54:duration=16:sample_rate=22050",
      "-f", "lavfi", "-i", "anoisesrc=color=brown:duration=16:sample_rate=22050",
      "-filter_complex",
      "[0:a]volume=0.11[a];[1:a]highpass=f=35,lowpass=f=480,volume=0.32[b];[a][b]amix=inputs=2:duration=longest,afade=t=in:st=0:d=0.6,afade=t=out:st=15:d=1",
    ],
  ],
  [
    "rain.mp3",
    [
      "-f", "lavfi", "-i", "anoisesrc=color=white:duration=12:sample_rate=22050",
      "-filter_complex", "highpass=f=1400,lowpass=f=7800,volume=0.18,afade=t=in:d=0.3,afade=t=out:st=11.4:d=0.6",
    ],
  ],
  [
    "footstep-dirt.mp3",
    [
      "-f", "lavfi", "-i", "anoisesrc=color=brown:duration=0.24:sample_rate=22050",
      "-filter_complex", "lowpass=f=240,afade=t=in:d=0.01,afade=t=out:st=0.05:d=0.18,volume=1.6",
    ],
  ],
  [
    "footstep-wood.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=180:duration=0.16:sample_rate=22050",
      "-f", "lavfi", "-i", "anoisesrc=color=white:duration=0.16:sample_rate=22050",
      "-filter_complex",
      "[0:a]afade=t=out:st=0.02:d=0.12,volume=0.5[a];[1:a]bandpass=f=980:width_type=h:w=700,afade=t=out:st=0.015:d=0.12,volume=0.45[b];[a][b]amix=inputs=2:duration=longest",
    ],
  ],
  [
    "door.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=240:duration=0.7:sample_rate=22050",
      "-f", "lavfi", "-i", "anoisesrc=color=pink:duration=0.7:sample_rate=22050",
      "-filter_complex",
      "[0:a]lowpass=f=700,vibrato=f=7:d=0.4,afade=t=in:d=0.03,afade=t=out:st=0.28:d=0.4,volume=0.45[a];[1:a]lowpass=f=900,afade=t=out:st=0.08:d=0.5,volume=0.18[b];[a][b]amix=inputs=2:duration=longest",
    ],
  ],
  [
    "generator.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=58:duration=6:sample_rate=22050",
      "-f", "lavfi", "-i", "sine=frequency=116:duration=6:sample_rate=22050",
      "-f", "lavfi", "-i", "anoisesrc=color=brown:duration=6:sample_rate=22050",
      "-filter_complex",
      "[0:a]volume=0.28[a];[1:a]volume=0.08[b];[2:a]lowpass=f=220,volume=0.16[c];[a][b][c]amix=inputs=3:duration=longest",
    ],
  ],
  [
    "radio-static.mp3",
    [
      "-f", "lavfi", "-i", "anoisesrc=color=white:duration=5:sample_rate=22050",
      "-filter_complex", "highpass=f=700,lowpass=f=5200,volume=0.22",
    ],
  ],
  [
    "radio-tone.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=440:duration=4:sample_rate=22050",
      "-filter_complex", "volume=0.18,afade=t=in:d=0.05",
    ],
  ],
  [
    "monster.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=46:duration=4:sample_rate=22050",
      "-f", "lavfi", "-i", "anoisesrc=color=brown:duration=4:sample_rate=22050",
      "-filter_complex",
      "[0:a]tremolo=f=0.35:d=0.75,lowpass=f=180,volume=0.4[a];[1:a]lowpass=f=300,volume=0.12[b];[a][b]amix=inputs=2:duration=longest",
    ],
  ],
  [
    "click.mp3",
    [
      "-f", "lavfi", "-i", "sine=frequency=1200:duration=0.06:sample_rate=22050",
      "-filter_complex", "afade=t=out:st=0.01:d=0.05,volume=0.3",
    ],
  ],
];

for (const [name, args] of jobs) {
  const dest = `${out}/${name}`;
  if (process.env.FORCE_AUDIO !== "1" && existsSync(dest) && statSync(dest).size > 300) continue;
  execFileSync("ffmpeg", ["-y", ...args, "-ac", "1", "-ar", "22050", "-c:a", "libmp3lame", "-b:a", "64k", dest], {
    stdio: "ignore",
  });
  process.stdout.write(`audio ${name}\n`);
}
