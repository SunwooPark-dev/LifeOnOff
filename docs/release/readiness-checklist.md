# Readiness Checklist

## Purpose
Use this checklist before calling the personal daily choice MVP release-ready.

## Product contract gates
- [ ] Request contract supports 2 to 5 options
- [ ] Ranked recommendation is blocked until user weights are explicitly confirmed
- [ ] Result contract distinguishes facts, inferences, assumptions, and unknowns
- [ ] Numeric output requires evidence refs or assumption refs
- [ ] No-auto-action rule is preserved in product copy and implementation
- [ ] Disallowed domains refuse or downgrade safely

## UX gates
- [ ] Real decision workspace replaces the default Next.js starter page
- [ ] UI can capture question, options, criteria, and weight confirmation
- [ ] UI surfaces run status and downgrade/refusal reasons clearly
- [ ] Visuals render only when validation and traceability permit them
- [ ] Recommendation summary remains explicitly non-binding

## Validation gates
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Unit tests pass
- [x] Browser-E2E evidence exists for weight confirmation
- [x] `pnpm proof:release` passes against the built app
- [x] Weight-confirmation proof packet is refreshed for the latest local proof run
- [ ] Downgrade/refusal paths are covered by tests
- [ ] Visual gating has explicit tests
- [ ] Chart rendering is impossible in blocked states

## Required verification commands
Run these from the repository root:

```bash
pnpm lint
pnpm typecheck
CI=1 pnpm test
pnpm build
pnpm proof:release
```

## Current blocker snapshot
As of the latest local docs / proof review:
- `pnpm lint`, `pnpm typecheck`, `CI=1 pnpm test`, and `pnpm build` are the currently verified baseline gates.
- Core contract and workspace behavior are implemented in the current codebase, including weight confirmation, downgrade/refusal behavior, provenance tagging, and visual gating.
- The stronger proof lane now exists as a browser-E2E run for the weight-confirmation flow plus the deterministic proof packet at `docs/release/weight-confirmation-proof-packet.md`, and the latest local `pnpm proof:release` refresh completed successfully.
- The repository is still not release-ready because the rest of this checklist remains open beyond that authority-path proof.
- Do not treat the weight-confirmation proof lane alone as proof that the full product is release-ready.

## Release rule
Do **not** present the app as a completed Possibility Explorer Codex MVP or as release-ready until all contract, UX, and validation gates above are satisfied, including a fresh browser-E2E proof run and refreshed proof packet.
