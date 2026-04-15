Prevent regressions while hardening the Life AB Test MVP

Formalized the regression suite around the built-in `node:test` API with a stable in-process runner entry at `tests/index.test.js`, avoiding the environment-specific EPERM issue from `node --test` process spawning. At the same time, the UI rendering path now uses DOM node construction instead of HTML string assembly, reducing the XSS regression surface while keeping the current UX intact.

Constraint: Current sandbox disallows the child-process spawning behavior used by `node --test`
Rejected: Vitest migration | would add unnecessary dependencies for this minimal local MVP
Rejected: Keep string-based rendering with escaping only | still leaves a larger XSS regression surface than DOM node construction
Confidence: high
Scope-risk: moderate
Directive: Keep future UI output on the DOM-node path; do not reintroduce direct HTML string composition for user-controlled data without a specific security review
Tested: `npm run test`, `npm run build`, `npm run generate`, local HTTP smoke on `server.js`
Not-tested: Browser-level visual regression across multiple browsers
