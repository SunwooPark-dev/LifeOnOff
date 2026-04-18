# Weight-Confirmation Rendered Proof Plan

## Goal
Strengthen the current weight-confirmation evidence from lib-level proof to a real browser/E2E proof lane without overclaiming full release readiness.

## Why this slice
Current proof already covers workspace and authority helpers at the lib seam. The remaining seam was the real client page wiring in `app/page.tsx`: checkbox interaction, edit-driven revocation, and user-visible recommendation/visual gating in the rendered UI. That lane is now implemented as a browser-E2E proof path and this plan should be read as the historical basis for the current proof workflow.

## Frozen scope
Add exactly one rendered-app/browser proof around the authority path:
1. initial render is blocked
2. explicit confirmation reveals recommendation + visual summary
3. a draft edit after confirmation revokes authority and hides both again

## Non-goals / anti-scope-creep
- No broad Playwright expansion beyond the authority-path proof
- No proof scope beyond the weight-confirmation authority path
- No screenshot or visual snapshot testing
- No broad UI refactor beyond accessibility/testability improvements needed for stable selectors
- No release-readiness overclaim
- No broad docs rewrite

## Acceptance criteria
1. A new rendered-app test fails first for the intended reason before harness code is added.
2. The passing proof observes rendered behavior, not only internal function return values.
3. The proof asserts:
   - recommendation text absent before confirmation
   - visual summary absent before confirmation
   - recommendation visible after explicit weight confirmation
   - at least one visual summary visible after confirmation
   - editing a weight after confirmation hides recommendation again
   - editing a weight after confirmation hides visual summaries again
4. Any testability changes to `app/page.tsx` are minimal and product-safe.
5. `pnpm proof:weight-confirmation` includes the new rendered proof lane.
6. Release docs only state the stronger rendered-app proof that actually exists after verification.
7. Full repo verification remains green: `pnpm lint && pnpm typecheck && CI=1 pnpm test && pnpm build`.

## Planned file touch set
- `app/page.weight-confirmation.integration.test.tsx` (new)
- `app/page.tsx` (only if minimal accessibility/testability attributes are needed)
- `package.json` (proof script and test deps if needed)
- `vitest.config.ts` (new, if required for jsdom/react plugin/path aliases)
- `vitest.setup.ts` (new, if required)
- `docs/release/weight-confirmation-proof-packet.md` (refreshed after proof passes)
- one or more release docs if evidence wording must be aligned

## Red / Green command contract
RED:
- `pnpm exec vitest run app/page.weight-confirmation.integration.test.tsx`

GREEN targeted:
- `pnpm exec vitest run app/page.weight-confirmation.integration.test.tsx`
- `pnpm proof:weight-confirmation`
- `pnpm proof:release`

Final verification:
- `pnpm lint && pnpm typecheck && CI=1 pnpm test && pnpm build`

## Review lanes
- Spec review: does the bounded slice prove the intended authority contract without overclaim?
- Quality review: are selectors stable, doc wording conservative, and repo churn bounded?
