# MVP Scope

## Product definition
Possibility Explorer Codex v1 is an explainable decision-support system for **personal daily choices**. A user brings one question plus **2 to 5 options**, the system proposes comparison criteria and structured reasoning, the user confirms or edits weights, and the product returns a non-binding recommendation summary only when safety and evidence gates pass.

## Core scope rules
- Personal daily choice MVP only
- Maximum 5 options per run
- No auto-action of any kind
- Recommendation remains advisory, never authoritative
- User weight confirmation is required before final ranked output
- Evidence and assumptions must remain distinguishable
- Weak evidence must trigger downgrade behavior instead of false precision
- Visual output is gated behind validation and traceability

## In scope
- Single decision question input
- 2 to 5 named options
- Criteria draft generation
- Weight confirmation/edit flow
- Provenance-aware structured result output
- Recommendation summary that explains tradeoffs without making the decision for the user
- Run-state rendering for draft, awaiting-user-weights, analysis-complete, downgraded, failed_safe, and refusal paths
- Numeric traceability and anti-false-precision rules
- Disallowed-domain refusal and downgrade logic

## Output expectations
Each completed run should be able to communicate:
- what the current question is
- which options are in play
- what criteria the comparison used
- which claims are facts, inferences, assumptions, or unknowns
- whether weights are confirmed
- why the current recommendation or downgrade state was reached
- what information could change the ordering
- what the user should validate next

## UX scope
- Single workspace for question entry and option editing
- Support for 2 to 5 options, not just A/B
- Clear display of criteria, user-confirmed weights, provenance, and uncertainty
- Timeline or status rendering for run lifecycle
- Visuals shown only when validation and traceability gates allow them
- Language that frames output as decision support, not prediction or advice

## Engineering scope
- Next.js App Router + TypeScript
- Contract-first schemas for request, run state, and result output
- Validation coverage for downgrade/refusal/weight-gate semantics
- Deterministic scaffolding where possible
- No effectful integrations that act on the user's behalf
- Lint, typecheck, tests, and build must pass for release candidates

## Out of scope
- More than 5 options
- Automated execution of a chosen option
- Professional advice positioning (medical, legal, financial, self-harm)
- Large-scale ingestion or world-model breadth as a v1 promise
- Accounts, billing, collaboration, saved histories, or organizational workflows

## Release standard for MVP completion
The MVP is implementation-ready only when:
- the request/run/result contracts match the PRD
- the UI supports 2 to 5 options and a weight confirmation gate
- ranked recommendation is blocked until weights are confirmed
- output includes provenance-aware explanation and uncertainty language
- downgrade/refusal/failed_safe behavior is covered by tests
- blocked states cannot serialize charts or precision-heavy visuals
- copy and behavior preserve user authority and no-auto-action rules