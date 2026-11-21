import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mp3 manifest", () => {
  it("ships original encoded clips with MP3 frame headers", () => {
    const files = readdirSync("public/audio").filter((name) => name.endsWith(".mp3"));
    expect(files.length).toBeGreaterThanOrEqual(8);
    for (const name of files) {
      const bytes = readFileSync(`public/audio/${name}`);
      expect(bytes.length).toBeGreaterThan(300);
      const id3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
      const frame = bytes[0] === 0xff && (bytes[1] ?? 0) >= 0xe0;
      expect(id3 || frame).toBe(true);
    }
  });
});
