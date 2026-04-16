# Publish-Ready Summary v1

## Branch state
- Branch: `codex/life-ab-test-mvp-hardening`
- Remote relation at capture time: **ahead 3** of `origin/codex/life-ab-test-mvp-hardening`

## Landed commits
1. `7a82790` — *Make Chapter 10 prove the tradeoff in one visible scene*
2. `8734702` — *Keep the editorial control docs honest after the smaller lanes landed*
3. `6baf552` — *Seal the hold-state handoff for future sessions*

## What landed
### 1. Chapter 10 proof upgrade
- Added a compact witnessed tradeoff moment to `manuscript/sample-chapter-10-planning-and-decision-making-with-ai.md`
- Recorded the bounded change in:
  - `docs/ch10-scene-proof-micro-tranche-report.md`
  - `docs/ch10-scene-proof-reread-note.md`

### 2. Editorial control-plane reconciliation
- Updated historical status docs so they reflect already-landed cleanup lanes rather than pre-landing state
- Added:
  - `docs/post-cleanup-residual-risk-synthesis.md`
  - `docs/ch10-hold-observe-checkpoint.md`
  - `docs/lore-commit-plan-ch10-control-reconciliation.md`

### 3. Hold-state sealing
- Added `docs/handoff-v1-hold-observe.md`
- Tightened `docs/focused-reread-summary.md` so it no longer implies the residual-risk synthesis should itself choose the next tranche

## Why it matters
- Chapter 10 now proves its planning tradeoff in a visible scene rather than only in narrated summary.
- The manuscript-control docs are aligned with git history and no longer encourage reopening stale backlog lanes.
- Future sessions inherit a **hold / observe** gate instead of drifting back into unsignaled edits.

## Verification evidence
- `npm run build` — passed after the landed commits
- `npm test` — passed (`14/14`) after the landed commits
- `npm run generate` — passed after the Chapter 10 + control-plane checkpoint sequence
- `git status --short` — clean immediately before preparing this publish-ready summary

## Current control pair
- `docs/post-cleanup-residual-risk-synthesis.md`
- `docs/ch10-scene-proof-reread-note.md`

## Hold gate
Do **not** reopen nearby chapters from historical memory alone.

Only reopen work when a **fresh chapter-bounded reread signal** identifies:
1. the chapter at issue,
2. the exact passage-level failure or proof gap,
3. why the fix remains narrower than a rewrite.

## Reviewer focus
If this branch is pushed or reviewed, the highest-value review focus is:
1. whether the Chapter 10 proof splice improves concreteness without changing chapter role,
2. whether the control docs now truthfully match landed history,
3. whether the hold gate is clear enough to prevent stale backlog reactivation.

Reviewers do **not** need to re-litigate:
- whether a broad new reread packet should open now,
- whether a new large revision batch should begin,
- whether external commercialization should resume.
