import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readRepoFile(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments), "utf8");
}

function generatePacketPreview() {
  return execFileSync(
    process.execPath,
    [
      join(process.cwd(), "scripts", "release-proof-packet.mjs"),
      "--status",
      "pending-refresh",
      "--generated-at",
      "pending-refresh",
      "--command",
      "pnpm proof:release",
      "--required-artifact",
      "playwright-report/index.html",
      "--required-artifact",
      "test-results/weight-confirmation/results.json",
      "--stdout",
    ],
    { encoding: "utf8" },
  );
}

describe("release docs stay aligned with the intended proof lane", () => {
  const controllerVerdict = readRepoFile("docs", "release", "2026-04-17-controller-verdict.md");

  it("keeps the README aligned with the current app reality and next proof contract", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toMatch(/working Possibility Explorer Codex workspace/i);
    expect(readme).toMatch(/2 to 5 options/i);
    expect(readme).toMatch(/weights? are explicitly confirmed/i);
    expect(readme).toMatch(/browser[- ]based E2E release-proof lane|browser[- ]E2E proof lane/i);
    expect(readme).toMatch(/pnpm proof:release/i);
    expect(readme).toMatch(/not yet release-ready/i);
    expect(readme).not.toMatch(/default Next\.js starter screen/i);
  });

  it("documents the stronger proof lane without overclaiming readiness in the current gap review", () => {
    const gapReview = readRepoFile("docs", "release", "current-gap-review.md");

    expect(gapReview).toMatch(/2 to 5 option contract/i);
    expect(gapReview).toMatch(/weight-confirmation gate/i);
    expect(gapReview).toMatch(/provenance taxonomy/i);
    expect(gapReview).toMatch(/visual gating/i);
    expect(gapReview).toMatch(/browser[- ]E2E/i);
    expect(gapReview).toMatch(/proof packet/i);
    expect(gapReview).toMatch(/not release-ready/i);
    expect(gapReview).not.toMatch(/exactly two options/i);
    expect(gapReview).not.toMatch(/default Next\.js starter page/i);
  });

  it("keeps the readiness checklist focused on the integrated proof lane and remaining release gates", () => {
    const checklist = readRepoFile("docs", "release", "readiness-checklist.md");

    expect(checklist).toMatch(/browser[- ]E2E evidence exists for weight confirmation/i);
    expect(checklist).toMatch(/pnpm proof:release/i);
    expect(checklist).toMatch(/proof packet is refreshed/i);
    expect(checklist).toMatch(/not release-ready/i);
    expect(checklist).not.toMatch(/exactly two options/i);
    expect(checklist).not.toMatch(/template page/i);
  });

  it("requires a deterministic weight-confirmation proof packet with explicit evidence sections", () => {
    const packet = readRepoFile("docs", "release", "weight-confirmation-proof-packet.md");

    expect(packet).toMatch(/# Weight-Confirmation Proof Packet/i);
    expect(packet).toMatch(/## Proof scope/i);
    expect(packet).toMatch(/## Commands executed/i);
    expect(packet).toMatch(/## Packet status/i);
    expect(packet).toMatch(/## Required volatile artifacts/i);
    expect(packet).toMatch(/## Observed volatile artifacts/i);
    expect(packet).toMatch(/## Proven coverage/i);
    expect(packet).toMatch(/## Remaining next slice/i);
    expect(packet).toMatch(/post-confirmation draft edit revokes authority/i);
  });

  it("keeps the controller verdict aligned with the existence of the browser proof lane without overclaiming freshness", () => {
    expect(controllerVerdict).toMatch(/browser \/ E2E proof lane now exists|browser.*E2E proof lane now exists/i);
    expect(controllerVerdict).toMatch(/fresh recorded proof run|refresh.*proof/i);
    expect(controllerVerdict).not.toMatch(/there is still no recorded integration \/ E2E proof lane/i);
  });

  it("keeps the packet generator aligned with the committed packet contract", () => {
    const generated = generatePacketPreview();

    expect(generated).toMatch(/# Weight-Confirmation Proof Packet/);
    expect(generated).toMatch(/pending-refresh/);
    expect(generated).toMatch(/playwright-report\/index\.html/);
    expect(generated).toMatch(/test-results\/weight-confirmation\/results\.json/);
    expect(generated).toMatch(/proof:release/);
  });

  it("avoids claiming fresh browser evidence in a pending-refresh packet preview", () => {
    const generated = generatePacketPreview();

    expect(generated).toMatch(/pending-refresh/);
    expect(generated).toMatch(/Treat this packet as stale/i);
    expect(generated).not.toMatch(/Fresh browser-E2E evidence exists/i);
  });
});
