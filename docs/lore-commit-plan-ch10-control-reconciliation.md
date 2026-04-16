# Lore Commit Plan — Chapter 10 + Control Reconciliation

## Recommended split
Use **2 commits**.

### Why not 1
- The current changes include **one manuscript/content slice** and **one control-doc reconciliation slice**.
- Combining them would mix editorial content revision with status/bookkeeping updates.
- Splitting them keeps review and revert boundaries clean.

## Commit 1 — Chapter 10 scene-proof micro-tranche

### Files
- `manuscript/sample-chapter-10-planning-and-decision-making-with-ai.md`
- `docs/ch10-scene-proof-micro-tranche-report.md`
- `docs/ch10-scene-proof-reread-note.md`

### Lore draft
```text
Make Chapter 10 prove the tradeoff in one visible scene

The added meeting moment turns the premortem summary into a witnessed cost instead of a narrated one, so the chapter reads as planning judgment rather than abstract framework. The tranche report and reread note keep the scope chapter-bounded and document the verification boundary for future edits.

Constraint: Keep Chapter 10 limited to the existing planning scenario; do not reopen the broader launch-operations rewrite.
Rejected: Add a second scenario or broader framework layer | would widen scope and blur the chapter’s role.
Confidence: high
Scope-risk: narrow
Directive: Preserve the one-scenario, one-shift proof pattern unless a future reread proves it is insufficient.
Tested: Manual reread of the targeted passage and scope check in the tranche report.
Not-tested: Full manuscript-wide reread after this micro-tranche.
```

## Commit 2 — Internal control-doc reconciliation

### Files
- `docs/ch12-reserve-report.md`
- `docs/cold-reader-plain-language-report.md`
- `docs/focused-reread-packet.md`
- `docs/focused-reread-summary.md`
- `docs/internal-development-brief.md`
- `docs/revision-batch-1-report.md`
- `docs/scene-level-proof-report.md`
- `docs/post-cleanup-residual-risk-synthesis.md`
- `docs/ch10-hold-observe-checkpoint.md`
- `docs/lore-commit-plan-ch10-control-reconciliation.md`

### Lore draft
```text
Keep the editorial control docs honest after the smaller lanes landed

The status reports, reread packet, internal brief, hold checkpoint, and residual-risk synthesis now point to the completed micro-tranches instead of pre-landing language. That keeps the book-side control plane aligned with the actual history and leaves the next move gated on a fresh chapter-bounded signal rather than old backlog memory.

Constraint: Treat the .omx plan artifacts as local workspace evidence, not versioned manuscript assets.
Rejected: Fold these updates into the Chapter 10 pass | would mix content revision with control bookkeeping.
Confidence: high
Scope-risk: moderate
Directive: Keep future control-doc edits synchronized with landed tranches; do not reopen chapters from historical memory alone.
Tested: Manual consistency check across the updated reports, synthesis memo, and hold checkpoint.
Not-tested: External reader validation of the new hold gate.
```
