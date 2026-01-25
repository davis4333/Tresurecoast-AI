# Helper Scripts

This directory contains utility scripts to streamline development, testing, and deployment workflows.

## Available Scripts

### 🚀 quick-start.sh

**Purpose**: Automated setup for new developers joining the project

**Usage**:
```bash
./scripts/quick-start.sh
```

**What it does**:
1. Verifies Node.js 18+ is installed
2. Checks/installs pnpm
3. Installs all dependencies
4. Creates `.env` from template if missing
5. Checks PostgreSQL connection
6. Runs database migrations (if DB available)
7. Generates Prisma Client
8. Runs preflight environment checks
9. Verifies TypeScript, linting, and tests

**Use this when**:
- Setting up the project for the first time
- Onboarding new team members
- Resetting your local environment

---

### ✅ verify-gates.sh

**Purpose**: Run all quality gates in sequence (CI/CD compatible)

**Usage**:
```bash
# Run all gates including build
./scripts/verify-gates.sh

# Skip build step (faster for local dev)
./scripts/verify-gates.sh --skip-build
```

**Quality Gates**:
- **Gate A**: Install (pnpm install)
- **Gate B**: Preflight (environment validation)
- **Gate C**: TypeScript (zero compilation errors)
- **Gate D**: Lint (zero ESLint warnings)
- **Gate E**: Tests (704 unit tests)
- **Gate F**: Build (production build)
- **Gate G**: DB Tests (conditional - requires PostgreSQL)
- **Gate H**: E2E Tests (conditional - requires dev server)

**Exit Codes**:
- `0`: All gates passed
- `1`: One or more gates failed

**Use this when**:
- Before committing code
- In CI/CD pipelines
- Before creating pull requests
- Before deploying to staging/production

---

### 🔍 deployment-readiness.sh

**Purpose**: Comprehensive pre-deployment verification

**Usage**:
```bash
# Check staging readiness
./scripts/deployment-readiness.sh staging

# Check production readiness
./scripts/deployment-readiness.sh production
```

**Checks Performed**:

1. **Git Status**
   - Working directory is clean
   - Current branch info

2. **Quality Gates**
   - Dependencies installed
   - TypeScript passes
   - Linting passes
   - Tests pass

3. **Environment Configuration**
   - Required variables set
   - Optional variables present
   - Variable format validation

4. **Database**
   - Connection reachability
   - Migration status

5. **Build Verification**
   - Production build exists
   - Build freshness

6. **External Services**
   - Clerk configuration (test vs live keys)
   - Stripe configuration (test vs live keys)
   - OpenAI configuration
   - Upstash Redis configuration

7. **Security**
   - `.env` not tracked in git
   - No hardcoded secrets in source code

**Exit Codes**:
- `0`: Ready for deployment
- `1`: Not ready (has failures)

**Use this when**:
- Before deploying to staging
- Before deploying to production
- After configuring new environment variables
- As part of deployment workflows

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Quality Gates
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Run Quality Gates
        run: ./scripts/verify-gates.sh
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          # ... other env vars
```

### Pre-commit Hook Example

```bash
# .git/hooks/pre-commit
#!/bin/bash
./scripts/verify-gates.sh --skip-build
```

---

## Troubleshooting

### Script Won't Execute

**Problem**: `Permission denied`

**Solution**:
```bash
chmod +x scripts/*.sh
```

---

### Database Tests Skip

**Problem**: Gate G (DB Tests) always skips

**Solution**:
1. Ensure PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```
2. Check `DATABASE_URL` in `.env`
3. Run migrations:
   ```bash
   pnpm prisma migrate deploy
   ```

---

### E2E Tests Skip

**Problem**: Gate H (E2E Tests) always skips

**Solution**:
1. Start dev server in separate terminal:
   ```bash
   pnpm dev
   ```
2. Install Playwright browsers:
   ```bash
   pnpm exec playwright install --with-deps chromium
   ```
3. Re-run script

---

### Environment Validation Fails

**Problem**: Preflight gate fails with "Invalid format"

**Solution**: Check your `.env` file format:
- `DATABASE_URL` should start with `postgresql://`
- Clerk keys: `pk_test_` or `pk_live_`, `sk_test_` or `sk_live_`
- No extra quotes or spaces around values

---

## Best Practices

### Local Development

1. Run `quick-start.sh` when setting up the project
2. Run `verify-gates.sh --skip-build` before committing
3. Run full `verify-gates.sh` before creating PRs

### CI/CD

1. Run `verify-gates.sh` on every push
2. Run `deployment-readiness.sh` before deployments
3. Set appropriate environment variables in CI

### Deployments

1. Run `deployment-readiness.sh staging` before staging deployment
2. Verify staging deployment manually
3. Run `deployment-readiness.sh production` before production deployment
4. Monitor logs after deployment

---

## Script Maintenance

These scripts are designed to be:
- **Self-documenting**: Clear output messages
- **Fail-fast**: Exit immediately on critical errors
- **Idempotent**: Safe to run multiple times
- **CI-friendly**: Exit codes indicate success/failure

When adding new quality gates or checks:
1. Update the relevant script
2. Test locally first
3. Update this README
4. Update `.github/workflows/` if needed

---

## Related Documentation

- **Platform Status**: `../CODEX_PLATFORM_STATUS_REPORT.md`
- **Quality Gates**: `../CODEX_GATE_SCORECARD.md`
- **Security Audit**: `../CODEX_SECURITY_AUDIT.md`
- **Deployment Guide**: `../CODEX_DEPLOYMENT_PLAYBOOK.md`
- **Todo & Gaps**: `../CODEX_TODO_GAPS.md`

---

**Last Updated**: 2026-01-24
**Maintained by**: Development Team
