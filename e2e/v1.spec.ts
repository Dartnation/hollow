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
    await page.screenshot({ path: `docs/evidence/v1/${name}.png` });
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
  await page.screenshot({ path: "docs/evidence/v1/04-power.png" });
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placePlayer(112.4, 142.6);
    api?.lookAt(107.2, 147.4);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "docs/evidence/v1/05-interior.png" });
  await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placeMonster(101, 120);
    api?.placePlayer(95.5, 116.5);
    api?.lookAt(101, 121);
    api?.setHudVisible(false);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: "docs/evidence/v1/07-monster.png" });

  const mission = await page.evaluate(() => {
    const api = window.__HOLLOW__;
    api?.placePlayer(75, 72);
    api?.step(0.3);
    api?.placePlayer(110.2, 144.6);
    return api?.snapshot().mission;
  });
  expect(mission === "INSPECT_POWER" || mission === "DIVERT_POWER" || mission === "TUNE_SIGNAL").toBeTruthy();

  const fps = await page.evaluate(() => window.__HOLLOW__?.fps() ?? 0);
  const report = { fps, errors, mission, seed: 170147 };
  writeFileSync("docs/evidence/v1/report.json", JSON.stringify(report, null, 2));
  expect(errors, errors.join("\n")).toEqual([]);
  expect(fps).toBeGreaterThan(0);
});
