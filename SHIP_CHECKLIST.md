# Ship Checklist

## Prerequisites
All items must be GREEN before shipping to production.

## Ship Gate Commands

```bash
# Quick gate (CI)
pnpm prisma generate && pnpm prisma migrate status && pnpm typecheck && pnpm test && pnpm playwright test --project=smoke && pnpm playwright test --project=security

# Full ship gate
pnpm prisma generate && pnpm prisma migrate status && pnpm typecheck && pnpm test && pnpm playwright test --project=smoke && pnpm playwright test --project=security && pnpm playwright test --project=visual && pnpm playwright test --project=chromium && pnpm build
```

## Binary Checklist

| Gate | Command | Required |
|------|---------|----------|
| Schema | `pnpm prisma generate` | PASS |
| Migrations | `pnpm prisma migrate status` | PASS |
| Types | `pnpm typecheck` | PASS |
| Unit Tests | `pnpm test` (vitest) | PASS |
| E2E Smoke | `pnpm playwright test --project=smoke` | PASS |
| E2E Security | `pnpm playwright test --project=security` | PASS |
| E2E Visual | `pnpm playwright test --project=visual` | PASS (no unexpected diffs) |
| E2E Full | `pnpm playwright test --project=chromium` | PASS |
| Build | `pnpm build` | PASS |

## Security Verification

- [ ] `DEV_BYPASS_AUTH` is NOT set or is `false` in production
- [ ] `PLAYWRIGHT_TEST` is NOT set in production
- [ ] All required environment variables are present (validated at boot)
- [ ] No secrets exposed in client-side code

## Visual Regression

- [ ] Visual suite passes with 0 unexpected diffs
- [ ] Any visual changes are intentional and reviewed

## Final Sign-Off

Ship only when:
1. Full gate command passes with 0 failures
2. Visual suite has no unexpected diffs
3. Security suite passes
4. Environment validation passes at boot
