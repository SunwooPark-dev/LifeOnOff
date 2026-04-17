# Possibility Explorer Codex

Possibility Explorer Codex is a contract-first decision-support app for personal daily choices. The product helps a user compare up to five options, inspect the evidence and assumptions behind each comparison, confirm their own decision weights, and receive a non-binding recommendation summary without pretending to know the future.

## Current status

This repository is still in early implementation. The PRD and test spec define a broader contract than the current code implements today.

Current repo reality:
- input/output schema scaffolding exists in `lib/schemas/`
- product and architecture docs exist under `docs/`
- the UI is still a default Next.js starter screen
- the app is **not** release-ready for the v1 PRD yet

See `docs/release/current-gap-review.md` for the documented gap review and `docs/release/readiness-checklist.md` for the release gate.

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
npm install
npm run dev
npm run lint
npm run typecheck
npm run test:run
npm run build
```

## Repository map

- `app/` — Next.js App Router UI
- `lib/schemas/` — request/result schema scaffolding and tests
- `docs/product/` — product framing and MVP scope
- `docs/architecture/` — contract and state-machine notes
- `docs/release/` — readiness review, blockers, and verification expectations

## Documentation index

- `docs/product/mvp-scope.md`
- `docs/architecture/simulation-contract.md`
- `docs/release/current-gap-review.md`
- `docs/release/readiness-checklist.md`

## Notes for implementers

- Keep the PRD as the source of truth for release scope.
- Treat simulation/world-model breadth as an internal seam, not a v1 product promise.
- Prefer safe downgrade or refusal over fabricated certainty.