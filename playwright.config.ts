import { defineConfig, devices } from "@playwright/test";

const HOST = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? "3000");
const baseURL = `http://${HOST}:${PORT}`;
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results/weight-confirmation";
const htmlReportDir = process.env.PLAYWRIGHT_HTML_REPORT ?? "playwright-report";
const jsonReportFile = process.env.PLAYWRIGHT_JSON_REPORT ?? `${outputDir}/results.json`;

const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  `pnpm build && pnpm exec next start --hostname ${HOST} --port ${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["html", { open: "never", outputFolder: htmlReportDir }], ["json", { outputFile: jsonReportFile }], ["list"]]
    : [["html", { open: "never", outputFolder: htmlReportDir }], ["json", { outputFile: jsonReportFile }], ["list"]],
  outputDir,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
