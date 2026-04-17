# Simulation Contract

## Purpose
Define the durable v1 contract for a personal daily-choice decision-support run. The system accepts a decision question plus up to five options, builds criteria and provenance-aware reasoning, waits for explicit user weight confirmation, and only then may emit a ranked recommendation summary.

## Contract principles
1. Evidence before numerics
2. Assist, do not act
3. Explainability before optimization breadth
4. Safe downgrade over fabricated certainty
5. Contract first, engines second, UX third

## Request contract (v1 target)

Required concepts:
- `question`: the decision the user is trying to make
- `options`: array of 2 to 5 option objects
- `context`: optional supporting context
- `constraints`: hard boundaries or non-negotiables
- `criteria_seed`: optional user-provided evaluation criteria
- `weights`: optional draft weights before confirmation
- `domain`: must remain inside the personal daily choice boundary

Per-option minimum shape:
- `id`
- `label`
- optional `notes`

Validation rules:
- reject fewer than 2 or more than 5 options
- reject duplicate options after normalization
- reject disallowed-domain prompts
- accept partial context, but route thin inputs toward downgrade or stronger uncertainty language
- preserve schema-valid structure even when ranking must be blocked

## Run state contract

Required run states:
- `draft`
- `validating-inputs`
- `awaiting-user-weights`
- `analysis-complete`
- `qualitative_only`
- `downgraded`
- `failed_safe`
- `refusal`

Precedence rules:
1. `refusal` beats every other path
2. `failed_safe` beats `downgraded`, `qualitative_only`, and `analysis-complete`
3. `awaiting-user-weights` blocks final ranking even when everything else succeeds
4. `qualitative_only` and `downgraded` both block chart serialization

## Result contract (v1 target)

A terminal result should include these top-level concepts:
- `run_id`
- `status`
- `question`
- `options`
- `criteria`
- `weight_status`
- `analysis_summary`
- `recommendation_summary` (only when allowed)
- `next_questions`
- `warnings`
- `traceability`
- `visualization_status`

Per-criterion / per-option reasoning should preserve provenance links:
- `fact`
- `inference`
- `assumption`
- `unknown`

Numeric or ranked fields must carry `evidence_refs` or `assumption_refs`. If that requirement is not met, the system must omit or downgrade those fields.

## Weight confirmation gate

Final ranked recommendation is forbidden unless:
- every active criterion has a valid weight
- the user has explicitly confirmed those weights
- no contradictory or invalid totals remain

If those conditions are not met, the run stays in `awaiting-user-weights` and may only return provisional structure plus explanation.

## Anti-false-precision rules
- no precise ranking without confirmed weights
- no numeric claims without provenance references
- precision cap for displayed scores: max one decimal place
- ordinal bands such as `high`, `medium`, and `low fit` are preferred when evidence is weak
- if assumptions materially affect ordering, the result must say that ranking may change when assumptions or weights change

## Visual gating

Visualization is allowed only when:
- validation passes
- traceability passes
- the run is not `qualitative_only`, `downgraded`, `failed_safe`, or `refusal`

Visualization is blocked when:
- refs are missing
- the result was downgraded
- the output is qualitative-only
- the run failed safe
- the domain was refused

## Repository reality check

The current repository does **not** implement this full contract yet. At the moment it still models a narrower two-option A/B scaffold in `lib/schemas/`. Treat this document as the release contract target and the current code as partial bootstrap scaffolding.