# Repository Guidelines

## Current Working Lane
This repo supports two tracks: the **Life AB Test** MVP and the **internal book-development** workspace. Default to the internal editorial lane; publisher-packet and commercialization work stay deferred unless explicitly reopened. For book-side changes, read `docs/internal-development-brief.md` first. Do not mix app-code changes with editorial/commercialization asset changes in one PR unless the task explicitly spans both.

## Project Structure & Module Organization
- `src/core/` holds simulation, validation, reporting, storage, and server helpers.
- `src/ui/` contains browser wiring and rendering; `src/app/` contains service orchestration.
- `public/` contains the web entrypoint and styles; `server.js` serves the app locally.
- `tests/` contains `node:test` suites plus `tests/helpers/dom-stub.js`.
- `scripts/` contains repo utilities; `generated/` contains derived sample artifacts.
- `docs/`, `manuscript/`, `marketing/`, and `research/` are tracked editorial assets.

## Build, Test, and Development Commands
- `npm start` — run the local server on `http://localhost:3000`
- `npm run build` — file/wiring sanity check (`scripts/build-check.mjs`)
- `npm test` — run the full test entrypoint (`tests/index.test.js`)
- `npm run generate` — regenerate sample outputs in `generated/`

Before a PR, run: `npm run build && npm test && npm run generate`.

## Coding Style & Naming Conventions
Use ES modules, 2-space indentation, and small focused functions. Keep core logic in `src/core/` and DOM work in `src/ui/`. Use `camelCase` in JavaScript and kebab-case for Markdown filenames. Preserve existing payload keys such as `decision_title`, `option_a`, and `user_profile`. Do not reintroduce `innerHTML`-style rendering for user-controlled content.

## Testing Guidelines
Tests use `node:test` with `node:assert/strict`. Add new files under `tests/*.test.js`, then import them from `tests/index.test.js`. Mirror the module under test when naming files (for example, `src/core/report.js` → `tests/report.test.js`). Reuse `tests/helpers/dom-stub.js` for UI tests instead of adding new browser dependencies.

## Commit & Pull Request Guidelines
Recent commits use imperative, why-first subjects without Conventional Commit prefixes (for example, `Make Chapter 12 prove its tradeoff with less abstraction`). Before a PR, run build/test/generate, verify a local smoke run, and write Lore-style commit/PR text. Keep PRs focused and note whether changes affect the app lane or the internal editorial lane.

## Security & Configuration Tips
This repository is for local/internal use. Do not commit secrets, private reader data, or fabricated author/platform facts. Treat `generated/` as derived output: regenerate it instead of hand-editing.
