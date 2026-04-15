# PR Description Draft — Life AB Test test runner + render hardening

## Summary
This change formalizes the Life AB Test test workflow and further hardens the UI rendering layer.

### Included
- formalized test suite under `tests/` with a single stable entrypoint
- switched the project test command to an in-process Node test run compatible with the current environment
- replaced HTML-string-based rendering flow with DOM-node construction for history/results rendering
- preserved existing simulation, report, and generated artifact behavior

## Why
Two follow-up priorities remained after the earlier MVP/security fixes:
1. make the test workflow more formal and less ad hoc
2. reduce the chance of XSS regression by avoiding string-based HTML composition where possible

## What changed
### Test runner
- test cases now live in the `tests/` suite as the primary source of truth
- added/kept coverage for:
  - normalize defaults
  - validation fallback behavior
  - static path traversal blocking
  - fairness invariants
  - score bounds
  - confidence generation
  - sensitive-domain conservative policy
  - report/appendix contract
  - service-pipeline composition
  - safe rendering behavior
- `npm run test` now runs `node tests/index.test.js`

### Rendering safety
- `src/ui/render.js` now constructs DOM nodes instead of returning HTML strings
- `src/ui/app.js` mounts rendered fragments rather than injecting HTML blobs
- rendering tests confirm malicious strings remain inert text and do not become executable nodes

## Verification
- `npm run test`
- `npm run build`
- `npm run generate`
- local smoke on `server.js` (HTTP 200)

## Risks / Notes
- the project now uses a formalized Node test suite, but still does not have TypeScript/tsconfig-level type checking
- DOM rendering is safer than the previous string approach, though a richer browser test layer could still be added later
