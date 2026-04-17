# Current Gap Review

## Review summary
This repository contains useful bootstrap scaffolding, but it is **not yet aligned** with the current PRD for Possibility Explorer Codex. The implemented schemas and starter UI still reflect an earlier two-option Life A / Life B concept, while the release contract now requires a personal daily choice MVP with up to five options, weight confirmation, provenance taxonomy, downgrade/refusal behavior, and visual gating.

## Findings

### 1. Product scope drift
**Current code/docs:**
- existing docs and schemas are centered on exactly two options: `optionA` and `optionB`
- product copy still describes a Life A vs Life B simulator

**PRD target:**
- 2 to 5 options
- personal daily choice MVP
- recommendation summary only after explicit user weight confirmation

**Impact:**
- request and response contracts are not release-compatible yet
- current docs could mislead implementers into hard-coding the wrong product boundary

### 2. Missing run-state and weight-gate contract
**Current code/docs:**
- no documented repository-level state model for `awaiting-user-weights`, `downgraded`, `failed_safe`, or `refusal`
- no UI or schema evidence of a weight-confirmation gate

**PRD target:**
- explicit run lifecycle
- ranked recommendation blocked before confirmed weights

**Impact:**
- the most important user-authority guardrail is not yet represented in the codebase

### 3. Missing provenance taxonomy
**Current code/docs:**
- current schema output has assumptions and confidence notes, but not a typed provenance taxonomy
- no `fact / inference / assumption / unknown` tagging contract exists in implementation

**PRD target:**
- stable provenance taxonomy with versioning escape hatch
- evidence refs or assumption refs for numeric output

**Impact:**
- traceability, downgrade rules, and anti-false-precision requirements cannot be enforced reliably yet

### 4. Visual gating not represented
**Current code/docs:**
- no visualization gate contract or tests are present
- no documented release blocker for blocked-state chart rendering

**PRD target:**
- chart serialization blocked for qualitative-only, downgraded, failed_safe, refusal, or missing-ref states

**Impact:**
- release safety criteria are incomplete

### 5. UI is still template-level
**Current code/docs:**
- `app/page.tsx` is still the default Next.js starter page
- `app/layout.tsx` metadata is still template text

**Impact:**
- the app does not yet expose the real product workflow
- docs must make clear that repository status is scaffold-only, not MVP-complete

## Strengths already present
- Next.js + TypeScript bootstrap is in place
- Zod schema tests exist and provide a good contract-first starting point
- docs structure is present and easy to expand
- the repo already emphasizes uncertainty and non-deterministic humility more than a generic template app

## Recommended next implementation order
1. Replace the two-option request/result schema with the 2-to-5 option contract
2. Add explicit run-state enums and weight-confirmation state transitions
3. Add provenance types and traceability fields before ranking logic expands
4. Build the actual decision workspace UI instead of the template landing page
5. Add downgrade/refusal/visual-gating tests before release candidate claims

## Release judgment
**Status:** not release-ready

The repository should be treated as a contract bootstrap, not as a finished MVP. Release readiness depends on contract alignment first, then UI/workflow implementation, then traceability and visual-gating verification.