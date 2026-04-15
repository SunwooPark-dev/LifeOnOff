# Push / PR Final Checklist

## Current branch
- `codex/life-ab-test-mvp-hardening`

## Pre-push checks
- [x] `npm run test`
- [x] `npm run build`
- [x] `npm run generate`
- [x] local smoke (`server.js` HTTP 200)
- [x] Lore commit finalized
- [x] PR body finalized
- [x] PR title finalized

## Push command
```bash
git push -u origin codex/life-ab-test-mvp-hardening
```

## PR title
See `docs/PR_TITLE_FINAL.txt`

## PR body
See `docs/PR_BODY_FINAL.md`

## Note
If `git remote -v` is empty, add the repository remote first before pushing.
