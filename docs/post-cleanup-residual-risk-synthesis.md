# Post-Cleanup Residual-Risk Synthesis — The High-Agency AI Worker

## Goal
Reconcile the repo after the smaller cleanup lanes landed and identify the next truthful editorial move.

## Reconciliation findings
### Git-backed lane status
The previously queued smaller cleanup lanes have already landed:
- `4a86678` — case-world diversification
- `4ae6c74` — scene-level proof
- `bf8e274` — Chapter 12 reserve proof
- `fe39722` — cold-reader / plain-language clarification
- `9542bb0` and `ae2d01e` — Chapter 4 bridge cleanup and follow-up verification alignment

### Evidence-chain repair
- Historical docs referenced `.omx/plans/test-spec-*.md` artifacts that were missing from the repo.
- Those plan/test-spec files have now been restored under `.omx/plans/` so the reports point to real artifacts again.
- Because `.omx/` is a local runtime area, treat those plan/test-spec files as workspace evidence rather than versioned manuscript assets.
- `docs/focused-reread-packet.md` and the smaller cleanup reports were updated to reflect completed status instead of pre-landing status language.

## Ranked residual issues
### 1. Chapter 10 still leans more on framework than visible scene proof
- **Severity:** High
- **Issue type:** scene-level proof
- **Why it remains:** the chapter explains a strong planning workflow, but most of the proof is still summarized rather than dramatized in one concrete decision moment.
- **Evidence:** the real-work scenario describes the option sequence cleanly, but the reader sees the workflow mostly as narrated steps rather than through one sharper tradeoff scene.
- **Recommended next move:** run one narrow scene-level proof micro-tranche in Ch.10 only, adding one compact moment where the recommendation changes because a hidden cost or fragile assumption becomes visible.
- **Non-goal:** do not reopen Chapter 10 as a broader planning-structure rewrite.

### 2. Residual case-world skew is reduced, but Chapter 10 still carries product/launch gravity
- **Severity:** Medium
- **Issue type:** case-world balance
- **Why it remains:** the diversification pass improved Chapters 5, 9, and 11, but Chapter 10 still centers a launch-style scenario.
- **Evidence:** the scenario remains anchored in launch scope, compliance timing, sales promises, and engineering delay.
- **Recommended next move:** if Ch.10 is reopened for proof, make the added proof moment usable beyond product/launch framing rather than rewriting the whole chapter around a new sector.
- **Non-goal:** do not open a second diversification lane across multiple chapters yet.

### 3. Cold-reader friction is lower, but plain-language grounding should stay watch-only for now
- **Severity:** Low
- **Issue type:** plain-language clarity
- **Why it remains:** the term “high-agency” is clearer after the Ch.14 anchor, but the repository does not show evidence that a broader cold-reader pass is still necessary.
- **Evidence:** `fe39722` landed the Ch.14 clarification, and no newer integrated read shows this issue rising above scene-proof needs.
- **Recommended next move:** leave this as watchlist-only unless a fresh cross-manuscript reread finds recurring confusion outside Ch.14.
- **Non-goal:** do not broaden plain-language edits across Part IV without new evidence.

## Recommendation
That recommendation has now been executed as the bounded Chapter 10 micro-tranche recorded in:
- `docs/ch10-scene-proof-micro-tranche-report.md`
- `docs/ch10-scene-proof-reread-note.md`

No additional editorial tranche should be opened from this memo alone. The next move, if any, should come from a fresh reread signal after the Chapter 10 pass rather than from reopening the same recommendation.

## Verification gate before that tranche
1. Use the restored `.omx/plans/` artifacts as the active verification reference set.
2. Keep any future tranche chapter-bounded.
3. Require one short post-pass reread note that confirms the proof addition increased concreteness without changing chapter role.

## Hold gate statement
This memo is a **control sheet**, not a standing instruction to keep reopening nearby chapters.

Until a fresh reread produces new chapter-bounded evidence:
- keep the current control pair as the source of truth
- treat remaining concerns as watch items rather than active drafting orders
- avoid reopening Ch.10–12 from historical memory alone
