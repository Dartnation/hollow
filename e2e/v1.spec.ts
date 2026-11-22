import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("plays the first night and records the hero shots", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?test=1&seed=170147");
  await page.waitForFunction(() => window.__HOLLOW__?.ready === true);
  await page.evaluate(() => window.__HOLLOW__?.start());
  await page.waitForTimeout(1200);
  const audio = await page.evaluate(() => window.__HOLLOW__?.snapshot().audio.loaded ?? 0);
  expect(audio).toBeGreaterThanOrEqual(8);

  const shot = async (name: string, x: number, z: number, lookX: number, lookZ: number) => {
    await page.evaluate(
      ({ x, z, lookX, lookZ }) => {
        const api = window.__HOLLOW__;
        api?.setHudVisible(false);
        api?.placePlayer(x, z);
        api?.lookAt(lookX, lookZ);
      },
      { x, z, lookX, lookZ },
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `docs/evidence/v2.1t/${name}.png` });
  };

  await shot("01-arrival", 2.2, 8, 40, 70);
  await shot("02-fork", 20, 40, 70, 78);
  await shot("03-slope", 24, 96, 30, 120);
  await shot("06-hut", 100, 128, 110, 145);
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placePlayer(110.2, 144.6);
    api?.lookAt(107.2, 147.5);
    api?.interact();
    api?.interact();
    api?.placePlayer(112.2, 142.2);
    api?.lookAt(113.15, 144.05);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "docs/evidence/v2.1t/04-power.png" });
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placePlayer(112.4, 142.6);
    api?.lookAt(107.2, 147.4);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/v2.1t/05-interior.png" });
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placeMonster(101, 120);
    api?.placePlayer(95.5, 116.5);
    api?.lookAt(101, 121);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "docs/evidence/v2.1t/07-monster.png" });
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.setFlashlight(true);
    api?.placePlayer(18, 36);
    api?.lookAt(24, 48);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/evidence/v2.1t/08-flashlight.png" });
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.setFlashlight(false);
    api?.placePlayer(100, 128);
    api?.lookAt(110, 145);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "docs/evidence/v2.1t/09-lights-off.png" });
  await shot("10-undergrowth", 14, 28, 22, 46);
  await shot("11-arrival-step", 8, 16, 40, 70);
  await shot("12-bridge", 68, 66, 86, 78);
  await shot("13-edge", 24, 96, -10, 96);
  await shot("16-stream", 64, 58, 78, 72);

  const mission = await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placePlayer(75, 72);
    api?.step(0.3);
    api?.placePlayer(110.2, 144.6);
    return api?.snapshot().mission;
  });
  expect(mission === "INSPECT_POWER" || mission === "DIVERT_POWER" || mission === "TUNE_SIGNAL").toBeTruthy();

  const samples: number[] = [];
  for (let i = 0; i < 8; i += 1) {
    await page.waitForTimeout(400);
    samples.push(await page.evaluate(() => window.__HOLLOW__?.fps() ?? 0));
  }
  const stats = await page.evaluate(() => window.__HOLLOW__?.stats());
  const fps = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const fpsMin = Math.min(...samples);
  const report = { fps, fpsMin, samples, stats, errors, mission, seed: 170147, note: "headless Chromium" };
  writeFileSync("docs/evidence/v2.1t/report.json", JSON.stringify(report, null, 2));
  expect(errors, errors.join("\n")).toEqual([]);
  expect(fps).toBeGreaterThan(0);
});

test("inspects trees and ground in neutral light", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?test=1&seed=170147&inspect=1");
  await page.waitForFunction(() => window.__HOLLOW__?.ready === true);
  await page.evaluate(() => window.__HOLLOW__?.start());
  const shot = async (name: string, x: number, z: number, lookX: number, lookZ: number) => {
    await page.evaluate(
      ({ x, z, lookX, lookZ }) => {
        const api = window.__HOLLOW__;
        api?.setHudVisible(false);
        api?.placePlayer(x, z);
        api?.lookAt(lookX, lookZ);
      },
      { x, z, lookX, lookZ },
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `docs/evidence/v2.1t/${name}.png` });
  };
  await shot("14-inspect-crown", 16, 30, 22, 38);
  await shot("15-inspect-ground", 18, 34, 19.4, 36.2);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("compares sample models with the current forest models", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?test=1&seed=170147&showroom=1");
  await page.waitForFunction(() => window.__HOLLOW__?.ready === true);
  await page.evaluate(() => window.__HOLLOW__?.start());
  const shot = async (name: string, x: number, z: number, lookX: number, lookZ: number, pitch: number) => {
    await page.evaluate(
      ({ x, z, lookX, lookZ, pitch }) => {
        const api = window.__HOLLOW__;
        api?.setHudVisible(false);
        api?.placePlayer(x, z);
        api?.lookAt(lookX, lookZ, pitch);
      },
      { x, z, lookX, lookZ, pitch },
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `docs/evidence/v2.1t/${name}.png` });
  };
  await shot("showroom-front", 0, -6, 0, 10, 0.12);
  await shot("showroom-spruce", 4.2, 3.2, 4.2, 8, 0.48);
  await shot("showroom-spruce-side", 9.2, 8, 4.2, 8, 0.2);
  await shot("showroom-pine", 4.2, 10.4, 4.2, 15, 0.42);
  await shot("showroom-fern", 6.4, 1.2, 6.4, 4.4, -0.28);
  const hollowErrors = await page.evaluate(() => window.__HOLLOW__?.errors ?? []);
  expect(errors, errors.join("\n")).toEqual([]);
  expect(hollowErrors, hollowErrors.join("\n")).toEqual([]);
});
