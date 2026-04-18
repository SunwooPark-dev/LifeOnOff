#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUTPUT_PATH = join("docs", "release", "weight-confirmation-proof-packet.md");
const DEFAULT_REQUIRED_ARTIFACTS = [
  "playwright-report/index.html",
  "test-results/weight-confirmation/results.json",
];

function parseArgs(argv) {
  const parsed = {
    status: "pending-refresh",
    output: OUTPUT_PATH,
    stdout: false,
    generatedAt: "pending-refresh",
    commands: [],
    requiredArtifacts: [...DEFAULT_REQUIRED_ARTIFACTS],
    observedArtifacts: [],
    note: "This committed packet is a stable summary until a fresh proof run refreshes it.",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--status") {
      parsed.status = argv[i + 1] ?? parsed.status;
      i += 1;
    } else if (arg === "--output") {
      parsed.output = argv[i + 1] ?? parsed.output;
      i += 1;
    } else if (arg === "--generated-at") {
      parsed.generatedAt = argv[i + 1] ?? parsed.generatedAt;
      i += 1;
    } else if (arg === "--command") {
      parsed.commands.push(argv[i + 1] ?? "");
      i += 1;
    } else if (arg === "--required-artifact") {
      parsed.requiredArtifacts.push(argv[i + 1] ?? "");
      i += 1;
    } else if (arg === "--observed-artifact") {
      parsed.observedArtifacts.push(argv[i + 1] ?? "");
      i += 1;
    } else if (arg === "--note") {
      parsed.note = argv[i + 1] ?? parsed.note;
      i += 1;
    } else if (arg === "--stdout") {
      parsed.stdout = true;
    }
  }

  parsed.commands = parsed.commands.filter(Boolean);
  parsed.requiredArtifacts = [...new Set(parsed.requiredArtifacts.filter(Boolean))];
  parsed.observedArtifacts = [...new Set(parsed.observedArtifacts.filter(Boolean))];

  return parsed;
}

function formatList(items) {
  return items.map((item) => `- \`${item}\``).join("\n");
}

function renderPacket({
  status,
  generatedAt,
  commands,
  requiredArtifacts,
  observedArtifacts,
  note,
}) {
  const proofScope = [
    "Prove the highest-risk user-authority path in a real browser: recommendation and visual-summary output stay blocked before explicit weight confirmation and become visible only after explicit confirmation.",
    "Keep the proof bounded to the weight-confirmation lane so release claims stay narrower than evidence.",
    "Commit a stable summary packet while leaving volatile browser artifacts uncommitted.",
  ];

  const commandLines = commands.length ? formatList(commands) : "- `pnpm proof:release`";
  const requiredArtifactLines = formatList(requiredArtifacts);
  const observedArtifactLines = observedArtifacts.length
    ? formatList(observedArtifacts)
    : "- No fresh volatile artifacts were recorded for this packet refresh.";
  const provenCoverage =
    status === "verified-browser-e2e"
      ? [
          "Fresh browser-E2E evidence exists for the weight-confirmation authority path.",
          "Recommendation content is absent while weight confirmation is still pending.",
          "Visual-summary content is absent while weight confirmation is still pending.",
          "Recommendation and visual-summary content become visible only after explicit weight confirmation.",
          "A post-confirmation draft edit revokes authority and hides recommendation plus visual-summary content again.",
          "The release-proof lane emitted a durable doc summary plus inspectable volatile artifacts for this refresh.",
        ]
      : [
          "This packet shape reserves space for browser-E2E evidence about the weight-confirmation authority path.",
          "Treat this packet as stale until a fresh proof run records observed volatile artifacts.",
          "Do not claim current browser-E2E evidence from this packet unless the status and observed artifacts confirm it.",
        ];

  return `# Weight-Confirmation Proof Packet

## Proof scope
${proofScope.map((line) => `- ${line}`).join("\n")}

## Commands executed
${commandLines}

## Packet status
- Status: \`${status}\`
- Generated at: \`${generatedAt}\`
- ${note}

## Required volatile artifacts
${requiredArtifactLines}

## Observed volatile artifacts
${observedArtifactLines}

## Proven coverage
${provenCoverage.map((line) => `- ${line}`).join("\n")}

## Remaining next slice
- Keep refreshing this packet whenever the proof lane changes.
- Do not overclaim broader release readiness from this single authority-path proof.
- Broader release readiness still depends on the rest of the documented checklist.`;
}

const options = parseArgs(process.argv.slice(2));
const output = renderPacket(options);

if (options.stdout) {
  process.stdout.write(output);
} else {
  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, output, "utf8");
}
