import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT) || 5199;

export default defineConfig({
  testDir: "e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 720 },
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    launchOptions: {
      args: ["--use-angle=default", "--enable-webgl", "--ignore-gpu-blocklist"],
    },
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/?test=1&seed=170147`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
