# Summary

This PR hardens and stabilizes the Life AB Test MVP without changing its core product direction.

It completes the follow-up reliability work after the MVP/security passes by:
- formalizing the local regression workflow,
- improving simulation confidence semantics,
- adding explicit input validation,
- separating UI orchestration from the simulation pipeline,
- and moving result/history rendering to a safer DOM-node path.

## What changed

### 1. Test runner formalization
- standardized the project around a stable in-process test entrypoint
- consolidated regression coverage under `tests/`
- `npm run test` now runs the formalized suite directly

Covered behaviors include:
- default-fill normalization
- enum / weight validation fallback
- static path traversal blocking
- fairness invariants
- score bounds
- confidence generation
- sensitive-domain conservative policy
- report / appendix contract
- service-layer composition
- rendering safety

### 2. Confidence model fixes
- confidence now meaningfully supports `high`, `medium`, and `low`
- score thresholds were clarified
- sensitive domains and lower-quality input still cap confidence conservatively

### 3. Input schema validation
- added an explicit validation/sanitization layer
- invalid enum values fall back safely
- malformed `weighting_override` values are normalized instead of leaking unstable state into the simulator
- normalization now exposes validation-related assumptions/issues

### 4. UI / engine separation
- introduced a simulation service entrypoint
- UI no longer manually chains normalize → simulate → report
- generation scripts reuse the same pipeline

### 5. Rendering hardening
- replaced HTML-string-based rendering flow with DOM-node construction
- user-controlled content now stays inert text
- reduces the chance of XSS regression reappearing later

### 6. Prior P0 fixes preserved
- static file traversal blocking remains in place
- export guide now points to Life AB Test artifacts rather than unrelated publishing docs

## Verification

- `npm run test`
- `npm run build`
- `npm run generate`
- local smoke on `server.js` → HTTP 200

## Result

The MVP remains a local, dependency-light simulation app, but now has:
- a more reliable verification workflow
- safer rendering behavior
- more explicit input normalization
- clearer confidence semantics
- lower coupling between UI and engine internals

## Risks / Notes

- the current environment still does not support direct `node --test` process-spawn execution cleanly, so the suite uses a stable in-process entrypoint instead
- browser-level visual regression testing is still not in place
- the validator is still a hand-rolled module; if rules grow significantly, it may be worth promoting it into a more formal schema layer later
