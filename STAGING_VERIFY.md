# Staging Verification Playbook

**Purpose**: Step-by-step commands to verify Treasure Coast AI platform in staging environment with all gates green.

**Expected Outcome**: Exit code 0 for all gates (tests, build, E2E).

---

## Prerequisites

Before starting, ensure you have:

- [ ] Access to staging environment
- [ ] Database credentials (PostgreSQL 16+)
- [ ] API keys for all required services
- [ ] `pnpm` version 9.15.0 installed
- [ ] Node.js version 22.x installed

---

## Step 1: Environment Configuration

### 1.1 Clone and Checkout

```bash
# Clone repository
git clone <repository-url>
cd Tresurecoast-AI

# Checkout the ship-ready branch
git checkout claude/treasure-coast-product-spec-aXHT6

# Install dependencies
pnpm install
```

### 1.2 Set Environment Variables

Create `.env` file with staging credentials:

```bash
cat > .env <<'EOF'
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Application
NEXT_PUBLIC_APP_URL="https://staging.treasurecoast.ai"

# AI Features
OPENAI_API_KEY="sk-..."

# Billing (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Optional - Demo Mode
NEXT_PUBLIC_DEMO_BOT_KEY="<uuid-of-demo-bot>"

# E2E Testing
NEXT_PUBLIC_DEV_BYPASS_AUTH="true"  # Only for staging E2E tests
DEV_BYPASS_AUTH="true"               # Only for staging E2E tests
PLAYWRIGHT_TEST="true"
EOF
```

**CRITICAL**: Verify all environment variables are set:

```bash
pnpm preflight
```

**Expected output**: All checks PASS

---

## Step 2: Database Setup

### 2.1 Verify Database Connectivity

```bash
# Check if database is reachable
tsx scripts/waitForDb.ts
```

**Expected output**:
```
⏳ Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready!
```

### 2.2 Run Migrations

```bash
# Generate Prisma client
pnpm prisma generate

# Run all pending migrations
pnpm prisma migrate deploy

# Verify migration status
pnpm prisma migrate status
```

**Expected output**:
```
Database schema is up to date!
```

### 2.3 (Optional) Seed Demo Data

If you want to test with sample data:

```bash
# Run seed script (if available)
pnpm prisma db seed
```

---

## Step 3: Code Quality Gates

### 3.1 TypeScript Type Checking

```bash
pnpm typecheck
```

**Expected exit code**: `0`
**Expected output**: No TypeScript errors

### 3.2 Linting

```bash
pnpm lint
```

**Expected exit code**: `0`
**Expected output**: `✔ No ESLint warnings or errors`

### 3.3 Production Build

```bash
pnpm build
```

**Expected exit code**: `0`
**Expected output**: Build completes with all routes compiled

---

## Step 4: Test Suite (All 732 Tests)

### 4.1 Run All Tests with Database

```bash
# Run all tests (unit + integration)
RUN_DB_TESTS=true pnpm test
```

**Expected results**:
- **Test Files**: 35 passed (35 total)
- **Tests**: 732 passed (732 total)
- **Exit code**: `0`

**Breakdown**:
- Unit tests (no DB required): ~704 tests
- Integration tests (require DB): ~28 tests

### 4.2 Verify Rate Limiting Tests

```bash
# Run rate limiting tests specifically
pnpm test tests/unit/rateLimit.test.ts
```

**Expected output**:
```
✓ LIMITS configuration defines correct thresholds for all endpoints
✓ demo_request endpoint should reject at 6 requests
✓ booking_click endpoint should reject at 21 requests
✓ bot_fetch endpoint should reject at 61 requests
✓ widget_config endpoint should reject at 61 requests
✓ messages_fetch endpoint should reject at 31 requests
✓ lead_detail endpoint should reject at 31 requests
✓ leads_recent endpoint should reject at 31 requests
✓ all 10 public endpoints have rate limiting configured
✓ demo_request has strictest limit (5) to prevent spam
✓ bot_fetch and widget_config have highest limits (60) for read operations
```

---

## Step 5: E2E Testing

### 5.1 Install Playwright Browsers

```bash
pnpm exec playwright install --with-deps chromium
```

### 5.2 Run E2E Smoke Tests

```bash
pnpm test:e2e:smoke
```

**Expected exit code**: `0`

**Tests should verify**:
- Landing page loads
- Demo bot interaction
- Navigation flows
- Widget embedding

### 5.3 Run E2E Security Tests

```bash
pnpm test:e2e:security
```

**Expected exit code**: `0`

**Tests should verify**:
- Rate limiting enforcement
- Authentication flows
- RBAC permissions
- Domain allowlisting

### 5.4 (Optional) Run All E2E Tests

```bash
# Run complete E2E suite (smoke + security + visual)
pnpm test:e2e
```

### 5.5 (Optional) Generate Visual Baselines

First time only - generate baseline screenshots:

```bash
pnpm test:e2e --project=visual --update-snapshots
```

Subsequent runs will compare against baselines.

---

## Step 6: Runtime Verification

### 6.1 Start Development Server

```bash
pnpm dev
```

**Expected output**:
```
   ▲ Next.js 14.2.35
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 2.3s
```

### 6.2 Verify Health Endpoint

In a new terminal:

```bash
curl http://localhost:3000/api/health
```

**Expected response**:
```json
{"ok":true}
```

### 6.3 Manual Smoke Tests

Open browser and verify:

1. **Landing Page**: http://localhost:3000
   - [ ] Page loads without errors
   - [ ] No console errors
   - [ ] Styling renders correctly

2. **Demo Mode** (if configured):
   - [ ] Demo widget loads
   - [ ] Can send chat message
   - [ ] Receives AI response
   - [ ] Can create lead

3. **Authentication**:
   - [ ] Sign-in page loads
   - [ ] Clerk authentication works
   - [ ] Redirects to dashboard after sign-in

4. **Dashboard** (requires auth):
   - [ ] Loads organization context
   - [ ] Shows correct RBAC permissions
   - [ ] Navigation works
   - [ ] Data loads from database

5. **Widget Embedding**:
   - [ ] Widget script endpoint works
   - [ ] Widget loads on external domain
   - [ ] Rate limiting applies (test with >30 requests)

---

## Step 7: Rate Limiting Verification

### 7.1 Verify Rate Limit Configuration

```bash
# Check that Upstash Redis is configured
node -e "console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ Set' : '❌ Not set')"
node -e "console.log('UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Set' : '❌ Not set')"
```

### 7.2 Test Rate Limiting (Manual)

Use a demo bot key for testing:

```bash
BOT_KEY="<demo-bot-public-key>"

# Should succeed (request 1-30)
for i in {1..30}; do
  curl -s "http://localhost:3000/api/public/chat" \
    -H "Content-Type: application/json" \
    -d "{\"botPublicKey\":\"$BOT_KEY\",\"message\":\"Test $i\"}" \
    | jq '.ok'
done

# Should fail with 429 (request 31)
curl -s "http://localhost:3000/api/public/chat" \
  -H "Content-Type: application/json" \
  -d "{\"botPublicKey\":\"$BOT_KEY\",\"message\":\"Test 31\"}" \
  | jq '.'
```

**Expected response for request 31**:
```json
{
  "ok": false,
  "error": "Rate limit exceeded"
}
```

**Response status**: `429 Too Many Requests`

---

## Step 8: Performance Verification

### 8.1 Build Size Analysis

```bash
# Check bundle sizes
pnpm build 2>&1 | grep "First Load JS"
```

**Verify**:
- [ ] Main bundle < 100 kB
- [ ] Route bundles reasonable sizes
- [ ] No unexpected large dependencies

### 8.2 Lighthouse Score (Optional)

```bash
# Install lighthouse
npm install -g lighthouse

# Run lighthouse on homepage
lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html
```

**Target scores**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

---

## Step 9: Database Integrity Checks

### 9.1 Verify Migrations

```bash
# List all migrations
pnpm prisma migrate status
```

**Expected**: All migrations applied, no pending migrations

### 9.2 Check Database Schema

```bash
# Open Prisma Studio to inspect data
pnpm prisma studio
```

**Verify**:
- [ ] All tables exist
- [ ] Indexes are created
- [ ] Constraints are applied
- [ ] Sample data looks correct (if seeded)

### 9.3 Test Tenant Isolation

```bash
# Run tenant isolation tests
pnpm test tests/unit/orgServices.route.test.ts --run
```

**Expected**: All tenant isolation tests pass

---

## Step 10: CI/CD Verification (GitHub Actions)

### 10.1 Trigger CI Pipeline

```bash
# Push to branch to trigger CI
git push origin claude/treasure-coast-product-spec-aXHT6
```

### 10.2 Monitor CI Run

Go to GitHub Actions tab and verify:

- [ ] Job 1: **Unit + Integration Tests** - ✅ PASS
  - PostgreSQL service starts
  - All 732 tests pass
  - Exit code 0

- [ ] Job 2: **E2E Tests** - ✅ PASS
  - Playwright browsers install
  - Smoke tests pass
  - Security tests pass
  - Exit code 0

- [ ] Job 3: **Lint** - ✅ PASS
  - No ESLint warnings or errors
  - Exit code 0

### 10.3 Review CI Artifacts

If any job fails, download artifacts:

1. Go to failed job
2. Scroll to bottom
3. Download artifacts:
   - `test-results` - Test failure details
   - `e2e-results` - E2E test reports
   - `e2e-traces` - Playwright traces for debugging

---

## Definition of Done Checklist

All the following must be ✅ GREEN:

### Code Quality ✅

- [ ] `pnpm typecheck` exits 0 (no TypeScript errors)
- [ ] `pnpm lint` exits 0 (no ESLint warnings)
- [ ] `pnpm build` exits 0 (production build succeeds)

### Test Coverage ✅

- [ ] `RUN_DB_TESTS=true pnpm test` exits 0 (all 732 tests pass)
- [ ] Unit tests: 704/704 pass
- [ ] Integration tests: 28/28 pass
- [ ] Rate limiting tests verify all 10 endpoints

### E2E Testing ✅

- [ ] `pnpm test:e2e:smoke` exits 0
- [ ] `pnpm test:e2e:security` exits 0
- [ ] Manual smoke tests pass

### Security ✅

- [ ] All 10 public API routes have rate limiting
- [ ] Rate limiting tests pass
- [ ] Authentication works
- [ ] RBAC enforced
- [ ] Tenant isolation verified
- [ ] Domain allowlisting works

### Database ✅

- [ ] Database connectivity verified
- [ ] All migrations applied
- [ ] Schema integrity confirmed
- [ ] Tenant isolation tests pass

### CI/CD ✅

- [ ] GitHub Actions CI passes (all 3 jobs green)
- [ ] No test failures in CI
- [ ] No flaky tests
- [ ] Artifacts available if needed

### Runtime ✅

- [ ] Health endpoint responds
- [ ] Landing page loads
- [ ] Dashboard accessible (with auth)
- [ ] Widget embedding works
- [ ] Rate limiting enforced in runtime
- [ ] No console errors

### Documentation ✅

- [ ] SHIP_READY_CERTIFICATION.md exists
- [ ] STAGING_VERIFY.md exists (this file)
- [ ] DB_SETUP.md updated with CI instructions
- [ ] README has deployment instructions

---

## Expected Results Summary

**When all gates are green, you should see**:

```
✅ TypeScript: 0 errors
✅ ESLint: 0 warnings
✅ Build: Success
✅ Tests: 732/732 pass (exit code 0)
✅ E2E Smoke: All pass (exit code 0)
✅ E2E Security: All pass (exit code 0)
✅ Rate Limiting: 10/10 routes protected
✅ CI Pipeline: All 3 jobs green
✅ Database: Connected and migrated
✅ Runtime: All manual tests pass
```

**Total gates**: 10 gates
**Required to ship**: 10/10 green ✅

---

## Troubleshooting

### Test Exit Code is 1

**Problem**: Tests exit with code 1 instead of 0

**Solution**:
```bash
# Check which tests are failing
RUN_DB_TESTS=true pnpm test 2>&1 | grep "FAIL"

# Common causes:
# 1. Database not reachable -> Verify DATABASE_URL and run tsx scripts/waitForDb.ts
# 2. Missing env vars -> Run pnpm preflight to check
# 3. Migrations not applied -> Run pnpm prisma migrate deploy
```

### E2E Tests Fail

**Problem**: Playwright tests fail

**Solution**:
```bash
# Ensure browsers are installed
pnpm exec playwright install --with-deps chromium

# Check if dev server is running
curl http://localhost:5000/api/health

# Run with debug mode
DEBUG=pw:api pnpm test:e2e:smoke
```

### Rate Limiting Not Working

**Problem**: Rate limiting not enforced

**Solution**:
```bash
# Verify Upstash Redis credentials are set
grep UPSTASH .env

# If not set, rate limiting is disabled (fail-open mode)
# Configure Upstash Redis and add credentials to .env
```

### Database Connection Fails

**Problem**: Cannot connect to PostgreSQL

**Solution**:
```bash
# Test connection manually
psql "$DATABASE_URL"

# Common issues:
# 1. SSL mode required -> Add ?sslmode=require to DATABASE_URL
# 2. Firewall blocking -> Whitelist your IP
# 3. Wrong credentials -> Verify username/password
# 4. Database doesn't exist -> Create it first
```

### CI Pipeline Fails But Local Passes

**Problem**: Tests pass locally but fail in CI

**Solution**:
1. Check GitHub Actions logs for specific errors
2. Verify GitHub secrets are configured correctly
3. Ensure PostgreSQL service starts in CI (check workflow YAML)
4. Look for timing issues (increase timeouts if needed)

---

## Next Steps After Green Gates

Once all gates are ✅ GREEN:

1. **Deploy to Staging Environment**:
   ```bash
   # Trigger staging deployment
   git checkout staging
   git merge claude/treasure-coast-product-spec-aXHT6
   git push origin staging
   ```

2. **Run E2E Against Live Staging**:
   ```bash
   PLAYWRIGHT_BASE_URL=https://staging.treasurecoast.ai pnpm test:e2e
   ```

3. **Monitor Staging**:
   - Check error logs
   - Verify rate limiting in Upstash dashboard
   - Test with real external clients

4. **Create Production Release**:
   ```bash
   git checkout main
   git merge staging
   git tag -a v1.0.0 -m "Production release - all gates green"
   git push origin main --tags
   ```

5. **Post-Deployment Verification**:
   - Health check responds
   - Widget loads on production domain
   - Rate limiting active
   - Analytics tracking working
   - No errors in logs

---

**Document Version**: 1.0
**Last Updated**: 2026-01-24
**Platform Version**: See SHIP_READY_CERTIFICATION.md
**Branch**: `claude/treasure-coast-product-spec-aXHT6`
