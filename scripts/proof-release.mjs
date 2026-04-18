#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? "3101");
const PNPM_COMMAND = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const REQUIRED_ARTIFACTS = [
  "playwright-report/index.html",
  "test-results/weight-confirmation/results.json",
];

function isPortAvailable(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

function run(command, args, env = process.env) {
  const useShell = process.platform === "win32" && /(^|\\|\/)pnpm(?:\.cmd)?$/i.test(command);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: useShell,
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? "unknown"}`);
  }
}

function writePacket({ status, note, observedArtifacts = [] }) {
  const args = [
    "scripts/release-proof-packet.mjs",
    "--status",
    status,
    "--generated-at",
    new Date().toISOString(),
    "--command",
    "pnpm build",
    "--command",
    "pnpm exec playwright test tests/e2e/weight-confirmation.spec.ts",
    "--note",
    note,
  ];

  REQUIRED_ARTIFACTS.forEach((artifact) => {
    args.push("--required-artifact", artifact);
  });

  observedArtifacts.forEach((artifact) => {
    args.push("--observed-artifact", artifact);
  });

  run(process.execPath, args);
}

const available = await isPortAvailable(HOST, PORT);

if (!available) {
  writePacket({
    status: "failed-port-collision",
    note: `pnpm proof:release aborted because ${HOST}:${PORT} was already in use.`,
  });
  console.error(`Port ${HOST}:${PORT} is already in use. Aborting proof run.`);
  process.exit(1);
}

try {
  run(PNPM_COMMAND, ["build"]);

  run(
    PNPM_COMMAND,
    ["exec", "playwright", "test", "tests/e2e/weight-confirmation.spec.ts"],
    {
      ...process.env,
      PLAYWRIGHT_HOST: HOST,
      PLAYWRIGHT_PORT: String(PORT),
      PLAYWRIGHT_WEB_SERVER_COMMAND: `${PNPM_COMMAND} exec next start --hostname ${HOST} --port ${PORT}`,
    },
  );

  const missingArtifacts = REQUIRED_ARTIFACTS.filter((artifact) => !existsSync(artifact));

  if (missingArtifacts.length > 0) {
    writePacket({
      status: "failed-missing-artifacts",
      note: `The proof run finished, but required volatile artifacts were missing: ${missingArtifacts.join(", ")}`,
      observedArtifacts: REQUIRED_ARTIFACTS.filter((artifact) => existsSync(artifact)),
    });
    console.error(`Missing required proof artifacts: ${missingArtifacts.join(", ")}`);
    process.exit(1);
  }

  writePacket({
    status: "verified-browser-e2e",
    note: "Fresh built-app browser-E2E proof completed successfully for this commit.",
    observedArtifacts: REQUIRED_ARTIFACTS,
  });
} catch (error) {
  writePacket({
    status: "failed-browser-e2e",
    note: error instanceof Error ? error.message : "Browser-E2E proof run failed.",
    observedArtifacts: REQUIRED_ARTIFACTS.filter((artifact) => existsSync(artifact)),
  });
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
