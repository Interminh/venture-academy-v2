import { defineConfig } from "@playwright/test";

try {
  process.loadEnvFile(".env.test");
} catch {
  // No .env.test, fall back to the environment.
}

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/report" }]],
  use: {
    baseURL: "https://www.ventureacademytutors.org",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
