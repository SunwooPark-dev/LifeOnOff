# Possibility Explorer Codex

Possibility Explorer Codex is a contract-first decision-support app for personal daily choices. The product helps a user compare up to five options, inspect the evidence and assumptions behind each comparison, confirm their own decision weights, and receive a non-binding recommendation summary without pretending to know the future.

## Current status

This repository now contains a working Possibility Explorer Codex workspace for the personal daily choice MVP. It is no longer a scaffold-only starter, but it is also not yet release-ready.

Current repo reality:
- `app/page.tsx` renders a real decision workspace for 2 to 5 options
- request/result contracts are enforced through Zod-backed schema and workspace seams in `lib/schemas/` and `lib/possibility-explorer/`
- ranked recommendations remain blocked until the user explicitly confirms weights
- provenance-aware output, downgrade/refusal behavior, and visual gating are represented in the current contract
- `pnpm lint`, `pnpm typecheck`, `CI=1 pnpm test`, and `pnpm build` are the currently verified baseline gates
- a browser-based E2E release-proof lane now exists around `pnpm proof:release` plus `docs/release/weight-confirmation-proof-packet.md`
- the latest local `pnpm proof:release` run refreshed the weight-confirmation proof packet, but the app is **not** release-ready yet because the broader release checklist still remains open

See `docs/release/current-gap-review.md` for the documented gap review, `docs/release/readiness-checklist.md` for the release gate, and `docs/release/weight-confirmation-proof-packet.md` for the release-proof packet contract.

## Product guardrails

The v1 release candidate is intentionally narrow:
- personal daily choice MVP only
- 2 to 5 options per run
- no automatic action taking
- ranked recommendation blocked until user weights are explicitly confirmed
- provenance required for claims and numeric output
- downgrade, refusal, and visual-gating rules required before final release
- anti-false-precision rules enforced when evidence is weak

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
CI=1 pnpm test
pnpm build
pnpm proof:release
```

## Repository map

- `app/` — Next.js App Router UI
- `lib/schemas/` — request/result schema contracts and tests
- `lib/possibility-explorer/` — engine, workspace seam, visual gating, and input-draft helpers
- `docs/product/` — product framing and MVP scope
- `docs/architecture/` — contract and state-machine notes
- `docs/release/` — readiness review, blockers, and verification expectations
- `scripts/release-proof-packet.mjs` — deterministic release-proof packet renderer for the weight-confirmation lane

## Documentation index

- `docs/product/mvp-scope.md`
- `docs/architecture/simulation-contract.md`
- `docs/release/current-gap-review.md`
- `docs/release/readiness-checklist.md`
- `docs/release/weight-confirmation-proof-packet.md`

## Notes for implementers

- Keep the PRD as the source of truth for release scope.
- Treat simulation/world-model breadth as an internal seam, not a v1 product promise.
- Prefer safe downgrade or refusal over fabricated certainty.
- Do not overclaim release readiness until a fresh browser-E2E proof packet refresh and the remaining release gates are complete.
