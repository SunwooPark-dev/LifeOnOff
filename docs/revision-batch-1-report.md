# Revision Batch 1 Report — The High-Agency AI Worker

## Goal
Execute the highest-priority fixes identified by the internal read-through.

## Status
Completed.

## Scope covered
- Part II de-templating
- Part II example diversification
- Chapter 7 proof upgrade
- Part III chassis reduction
- Chapter 11 boundary correction
- Chapter 9 case proof upgrade
- Part IV proof and payoff upgrade

## Files changed
- `manuscript/sample-chapter-04-think-before-you-prompt.md`
- `manuscript/sample-chapter-05-build-workflows-not-tricks.md`
- `manuscript/sample-chapter-06-keep-the-human-in-the-loop-but-put-the-human-in-the-right-loop.md`
- `manuscript/sample-chapter-07-taste-standards-and-the-fight-against-generic-output.md`
- `manuscript/sample-chapter-08-writing-with-ai.md`
- `manuscript/sample-chapter-09-research-with-ai.md`
- `manuscript/sample-chapter-10-planning-and-decision-making-with-ai.md`
- `manuscript/sample-chapter-11-communication-meetings-and-coordination.md`
- `manuscript/sample-chapter-12-what-becomes-more-valuable-when-ai-gets-cheap.md`
- `manuscript/sample-chapter-13-how-to-stay-useful-without-becoming-machine-shaped.md`
- `manuscript/sample-chapter-14-the-high-agency-future.md`
- `docs/revision-batch-1-report.md`
- `docs/internal-development-brief.md`

## Segment outcomes
### Part II
- Reduced recap-heavy transitions across Chapters 4–7
- Added a creator/individual-contributor mini-case in Part II
- Added a visible generic-vs-owned before/after artifact in Chapter 7

### Part III
- Reduced repeated application-chapter chassis across Chapters 8–11
- Recentered Chapter 11 on communication, handoff, and traceability
- Made Chapter 9’s enterprise-feature case carry source-ladder and uncertainty stakes more explicitly

### Part IV
- Made Chapter 12 prove more of its named scarce capacities
- Added a tighter week-in-the-life drift/repair sequence to Chapter 13
- Centered a clearer memo/checklist artifact in Chapter 14 for automate / deepen / refuse

## Verification summary
- Forbidden-pattern scan on session-owned files is clean
- `node scripts/build-check.mjs` passes
- `node tests/index.test.js` passes (**14/14**)
- `node scripts/generate-sample-run.mjs` passes
- Focused re-read packet and lane notes were completed across revised Parts II, III, and IV
- `docs/focused-reread-summary.md` concludes that the remaining issues are below the original P1 threshold

## Next queued action
Treat the smaller cleanup lanes as completed follow-up work and use `docs/post-cleanup-residual-risk-synthesis.md` to open the next chapter-bounded tranche only if current evidence justifies it.

## Remaining risks
- The manuscript still leans more on frameworks than scenes in a few places
- Product / launch / leadership examples still dominate the case world more than ideal
- ?High-agency? could still use one or two more plain-language restatements for cold readers

## Verification target
See `.omx/plans/test-spec-revision-batch-1.md`.
