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
- [ ] Integration or E2E coverage exists for weight confirmation
- [ ] Downgrade/refusal paths are covered by tests
- [ ] Visual gating has explicit tests
- [ ] Chart rendering is impossible in blocked states

## Required verification commands
Run these from the repository root:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

## Current blocker snapshot
As of the latest docs review:
- current request/output schema still models exactly two options
- no explicit weight-confirmation flow exists
- provenance taxonomy is not implemented yet
- UI is still a template page
- visual gating and downgrade/refusal verification are not yet represented in the product UI

## Release rule
Do **not** present the app as a completed Possibility Explorer Codex MVP until all contract, UX, and validation gates above are satisfied.