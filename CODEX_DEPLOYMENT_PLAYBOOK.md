# CODEX DEPLOYMENT PLAYBOOK
**Generated**: 2026-01-24
**Branch**: `claude/treasure-coast-product-spec-aXHT6`
**Commit**: `298d16c`

---

## EXECUTIVE SUMMARY

**Deployment Complexity**: MODERATE
**Time to Staging**: 4-6 hours
**Time to Production**: 2-3 hours (after staging validated)
**Dependencies**: PostgreSQL, Clerk, Stripe, Resend, Upstash Redis

---

## PREREQUISITES

### Required Accounts/Services

1. **Database**: PostgreSQL 16+
   - Recommended: [Neon](https://neon.tech) (serverless, generous free tier)
   - Alternatives: Supabase, Railway, Render

2. **Authentication**: [Clerk](https://clerk.com)
   - Sign up at https://dashboard.clerk.com
   - Create application
   - Get publishable key and secret key

3. **Billing**: [Stripe](https://stripe.com)
   - Sign up at https://dashboard.stripe.com
   - Get API keys (test and live)
   - Configure webhook endpoint

4. **Email**: [Resend](https://resend.com)
   - Sign up at https://resend.com
   - Verify domain
   - Get API key

5. **Rate Limiting**: [Upstash Redis](https://upstash.com)
   - Sign up at https://console.upstash.com
   - Create Redis database
   - Get REST URL and token

6. **Hosting**: [Vercel](https://vercel.com) (recommended)
   - Sign up at https://vercel.com
   - Connect GitHub repository

---

## ENVIRONMENT VARIABLES

### Required Variables

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Application (REQUIRED)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Optional Variables (Features Disabled if Missing)

```env
# AI Features
OPENAI_API_KEY="sk-..."

# Billing
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Notifications
RESEND_API_KEY="re_..."

# Rate Limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Optional - Demo Mode
NEXT_PUBLIC_DEMO_BOT_KEY="<uuid-of-demo-bot>"

# Optional - Development
DEV_BYPASS_AUTH="false"  # MUST be false or unset in production
NODE_ENV="production"
```

---

## STAGING DEPLOYMENT (DETAILED)

### Phase 1: Database Setup (1 hour)

**Step 1.1: Create Database**

**Option A: Neon (Recommended)**
```bash
# 1. Go to https://console.neon.tech
# 2. Click "Create Project"
# 3. Name: "treasure-coast-staging"
# 4. Region: Choose closest to your users
# 5. Postgres version: 16
# 6. Copy connection string
```

**Option B: Supabase**
```bash
# 1. Go to https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Name: "treasure-coast-staging"
# 4. Database password: Generate strong password
# 5. Region: Choose closest to your users
# 6. Go to Settings → Database
# 7. Copy connection string (Connection pooling → Transaction mode)
```

**Step 1.2: Verify Connection**
```bash
# Test connection locally
export DATABASE_URL="postgresql://..."
psql "$DATABASE_URL" -c "SELECT version();"
```

**Expected Output**:
```
PostgreSQL 16.x ...
```

---

**Step 1.3: Run Migrations**
```bash
# Clone repository (if not already)
git clone https://github.com/davis4333/Tresurecoast-AI.git
cd Tresurecoast-AI
git checkout claude/treasure-coast-product-spec-aXHT6

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy
```

**Expected Output**:
```
22 migrations found in prisma/migrations
Applying migration `20260118130000_replace_missingdataevent_with_dataevent`
...
Applying migration `20260120122457_add_booking_flow_event_type`
Done.
```

**Step 1.4: Verify Migration Status**
```bash
pnpm prisma migrate status
```

**Expected Output**:
```
Database schema is up to date!
```

---

### Phase 2: External Services Setup (2 hours)

**Step 2.1: Clerk Authentication**

```bash
# 1. Go to https://dashboard.clerk.com
# 2. Create new application or select existing
# 3. Name: "Treasure Coast AI - Staging"
# 4. Sign-in options: Enable email/password
# 5. Go to API Keys tab
# 6. Copy publishable key (starts with pk_test_)
# 7. Copy secret key (starts with sk_test_)
```

**Add to .env**:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

**Test**:
```bash
pnpm preflight
# Should show ✅ for Clerk keys
```

---

**Step 2.2: Stripe Billing**

```bash
# 1. Go to https://dashboard.stripe.com
# 2. Switch to Test mode (toggle in sidebar)
# 3. Go to Developers → API keys
# 4. Copy "Secret key" (starts with sk_test_)
# 5. Go to Developers → Webhooks
# 6. Click "Add endpoint"
# 7. Endpoint URL: https://your-staging-domain.com/api/billing/webhook
# 8. Events to send:
#    - checkout.session.completed
#    - customer.subscription.updated
#    - customer.subscription.deleted
# 9. Copy "Signing secret" (starts with whsec_)
```

**Add to .env**:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Create Products** (in Stripe Dashboard):
```
1. Go to Products → Add product
2. Create 3 products:
   - Starter: $X/month
   - Business: $Y/month
   - Enterprise: Custom pricing
3. Copy price IDs for later use (not needed in env vars)
```

---

**Step 2.3: Resend Email**

```bash
# 1. Go to https://resend.com/domains
# 2. Click "Add Domain"
# 3. Domain: your-domain.com
# 4. Follow DNS verification steps
# 5. Wait for verification (usually 5-10 minutes)
# 6. Go to API Keys
# 7. Click "Create API Key"
# 8. Name: "Treasure Coast Staging"
# 9. Copy API key (starts with re_)
```

**Add to .env**:
```env
RESEND_API_KEY="re_..."
```

**Test**:
```bash
# Create test file: test-email.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: 'onboarding@your-domain.com',
  to: 'your-email@example.com',
  subject: 'Test',
  text: 'Test email from Resend'
});

# Run: tsx test-email.ts
```

---

**Step 2.4: Upstash Redis**

```bash
# 1. Go to https://console.upstash.com
# 2. Click "Create Database"
# 3. Name: "treasure-coast-staging"
# 4. Type: Regional
# 5. Region: Choose closest to your app
# 6. Go to database details
# 7. Scroll to "REST API" section
# 8. Copy UPSTASH_REDIS_REST_URL
# 9. Copy UPSTASH_REDIS_REST_TOKEN
```

**Add to .env**:
```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

**Test**:
```bash
# Test rate limiting
curl -X POST "$UPSTASH_REDIS_REST_URL/incr/test-key" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# Should return: {"result":1}
```

---

**Step 2.5: OpenAI (Optional)**

```bash
# 1. Go to https://platform.openai.com/api-keys
# 2. Click "Create new secret key"
# 3. Name: "Treasure Coast Staging"
# 4. Copy key (starts with sk-)
```

**Add to .env**:
```env
OPENAI_API_KEY="sk-..."
```

---

### Phase 3: Deploy to Vercel (1 hour)

**Step 3.1: Connect Repository**

```bash
# 1. Go to https://vercel.com/new
# 2. Import Git Repository
# 3. Select: davis4333/Tresurecoast-AI
# 4. Framework Preset: Next.js (auto-detected)
# 5. Root Directory: ./
# 6. Don't deploy yet - configure env vars first
```

**Step 3.2: Configure Environment Variables**

```bash
# In Vercel dashboard:
# 1. Go to Settings → Environment Variables
# 2. Add all variables from .env (one by one)
# 3. Select environments: Production, Preview, Development
# 4. Click "Add" for each variable
```

**Required Variables Checklist**:
- [ ] DATABASE_URL
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [ ] CLERK_SECRET_KEY
- [ ] NEXT_PUBLIC_APP_URL (set to Vercel domain)
- [ ] OPENAI_API_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] RESEND_API_KEY
- [ ] UPSTASH_REDIS_REST_URL
- [ ] UPSTASH_REDIS_REST_TOKEN

**Step 3.3: Deploy**

```bash
# In Vercel dashboard:
# 1. Go to Deployments tab
# 2. Click "Redeploy" (or trigger new deployment)
# 3. Wait for build to complete (~2-3 minutes)
```

**Expected Build Output**:
```
✓ Compiled successfully
✓ Linting and type checking
✓ Collecting page data
✓ Generating static pages (7/7)
✓ Finalizing page optimization
```

**Step 3.4: Verify Deployment**

```bash
# Get deployment URL from Vercel dashboard
export STAGING_URL="https://your-app.vercel.app"

# Test health endpoint
curl "$STAGING_URL/api/health"
# Expected: {"ok":true}

# Test public page
curl -I "$STAGING_URL"
# Expected: HTTP/2 200
```

---

### Phase 4: Post-Deployment Verification (1-2 hours)

**Step 4.1: Run Smoke Tests**

```bash
# In local terminal (pointing to staging)
export PLAYWRIGHT_BASE_URL="$STAGING_URL"

# Install Playwright browsers (first time only)
pnpm exec playwright install --with-deps chromium

# Run smoke tests
pnpm test:e2e:smoke
```

**Expected**: All smoke tests pass

---

**Step 4.2: Manual QA Checklist**

Visit staging URL and verify:

**Public Pages**:
- [ ] Landing page loads (/)
- [ ] Pricing page loads (/pricing)
- [ ] Demo request form works (/request-demo)
- [ ] Sign-in page loads (/sign-in)

**Authentication**:
- [ ] Can create new account
- [ ] Can sign in with email/password
- [ ] Redirects to dashboard after sign-in
- [ ] Can sign out

**Dashboard** (after sign-in):
- [ ] Dashboard loads (/app)
- [ ] Shows organization name
- [ ] Navigation works
- [ ] No console errors

**Bot Creation**:
- [ ] Can create new bot (/app/bots)
- [ ] Bot appears in list
- [ ] Can edit bot settings
- [ ] Can view bot public key

**Widget**:
- [ ] Widget page loads (/widget/[botPublicKey])
- [ ] Chat interface renders
- [ ] Can send test message
- [ ] Receives response (if OpenAI configured)

**Lead Creation**:
- [ ] Can create lead via widget
- [ ] Lead appears in leads list (/app/leads)
- [ ] Lead scoring calculated

**Settings**:
- [ ] Business hours page works (/app/settings/hours)
- [ ] Services page works (/app/settings/services)
- [ ] Branding page works (/app/settings/branding)

**Billing** (if Stripe configured):
- [ ] Billing page loads (/app/settings/billing)
- [ ] Can initiate checkout
- [ ] Webhook endpoint works (test via Stripe CLI)

---

**Step 4.3: Security Verification**

```bash
# Test rate limiting
for i in {1..35}; do
  curl -X POST "$STAGING_URL/api/public/chat" \
    -H "Content-Type: application/json" \
    -d '{"botPublicKey":"test","message":"test"}' &
done
wait

# Should see some 429 responses after 30 requests
```

**Test RBAC**:
- [ ] CLIENT role cannot access admin pages
- [ ] CLIENT role cannot edit without allowClientEdits
- [ ] OWNER can access all pages

**Test Tenant Isolation**:
- [ ] Create two organizations
- [ ] Verify Org A cannot see Org B's data
- [ ] Verify Org B cannot see Org A's data

---

**Step 4.4: Performance Check**

```bash
# Install lighthouse
npm install -g lighthouse

# Run lighthouse
lighthouse "$STAGING_URL" \
  --output html \
  --output-path ./lighthouse-staging.html
```

**Target Scores**:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## PRODUCTION DEPLOYMENT

### Prerequisites
- [ ] Staging fully tested
- [ ] All QA checks passed
- [ ] No critical bugs
- [ ] Product owner approval

### Phase 1: Production Services (1 hour)

**Step 1.1: Upgrade to Production Keys**

**Clerk**:
```bash
# 1. Go to Clerk dashboard
# 2. Settings → Production
# 3. Get production keys (pk_live_, sk_live_)
```

**Stripe**:
```bash
# 1. Go to Stripe dashboard
# 2. Switch to "Live mode"
# 3. Get live keys (sk_live_)
# 4. Create new webhook endpoint for production URL
# 5. Get new webhook secret
```

**Others**:
- Resend: Already production-ready (same API key works)
- Upstash: Create new "production" database (separate from staging)
- OpenAI: Use same key or create production-specific key

---

**Step 1.2: Configure Production Environment in Vercel**

```bash
# 1. Go to Vercel project settings
# 2. Environment Variables
# 3. Update all variables for "Production" environment:
#    - Use production DATABASE_URL
#    - Use production Clerk keys (pk_live_, sk_live_)
#    - Use production Stripe keys (sk_live_)
#    - Use production Upstash credentials
#    - Set NEXT_PUBLIC_APP_URL to production domain
```

---

**Step 1.3: Custom Domain Setup**

```bash
# 1. Go to Vercel project → Settings → Domains
# 2. Add custom domain: app.your-domain.com
# 3. Add DNS records (shown in Vercel):
#    CNAME app.your-domain.com → cname.vercel-dns.com
# 4. Wait for DNS propagation (5-60 minutes)
# 5. Vercel auto-provisions SSL certificate
```

---

### Phase 2: Deploy to Production (30 minutes)

**Step 2.1: Deploy**

```bash
# Option A: Deploy via Vercel dashboard
# 1. Go to Deployments
# 2. Select staging deployment
# 3. Click "Promote to Production"

# Option B: Deploy via Git
git checkout main
git merge claude/treasure-coast-product-spec-aXHT6
git push origin main
# Vercel auto-deploys main branch to production
```

**Step 2.2: Verify Build**

```bash
# Watch build logs in Vercel dashboard
# Expected: ✓ Build completed successfully
```

**Step 2.3: Run Migrations**

```bash
# Migrations should auto-run during build
# Verify in build logs:
# "Running prisma migrate deploy"

# If not auto-run, run manually:
export DATABASE_URL="<production-db-url>"
pnpm prisma migrate deploy
```

---

### Phase 3: Production Verification (1 hour)

**Step 3.1: Smoke Test**

```bash
export PROD_URL="https://app.your-domain.com"

# Health check
curl "$PROD_URL/api/health"
# Expected: {"ok":true}

# Test public pages
curl -I "$PROD_URL"
# Expected: HTTP/2 200
```

**Step 3.2: Critical Path Test**

**Manual test**:
1. [ ] Go to production URL
2. [ ] Sign up with real email
3. [ ] Verify email works
4. [ ] Create organization
5. [ ] Create bot
6. [ ] Test widget on separate domain
7. [ ] Create lead via widget
8. [ ] Verify lead appears in dashboard
9. [ ] Test Stripe checkout (with test card if available)
10. [ ] Verify billing webhook received

**Step 3.3: Monitor for Errors**

```bash
# Watch Vercel logs in real-time
# Go to: Deployments → [latest] → Logs → Runtime Logs

# Look for:
# - No 500 errors
# - No unexpected exceptions
# - Normal traffic patterns
```

---

### Phase 4: Post-Launch Monitoring

**Step 4.1: Set Up Error Tracking** (Recommended)

**Option A: Vercel Analytics** (built-in)
```bash
# Already enabled in Vercel projects
# View at: Vercel Dashboard → Analytics
```

**Option B: Sentry** (advanced)
```bash
# 1. Sign up at https://sentry.io
# 2. Create new project (Next.js)
# 3. Install: pnpm add @sentry/nextjs
# 4. Run: npx @sentry/wizard@latest -i nextjs
# 5. Add SENTRY_DSN to env vars
# 6. Redeploy
```

**Step 4.2: Monitor Key Metrics**

**Daily checks** (first week):
- [ ] Error rate < 1%
- [ ] Response time < 2s (p95)
- [ ] Uptime > 99.9%
- [ ] No authentication failures
- [ ] No database connection issues

**Weekly checks**:
- [ ] Review error logs
- [ ] Check rate limit hits
- [ ] Review Stripe webhook success rate
- [ ] Check email delivery rates (Resend dashboard)

---

## ROLLBACK PLAN

### If Production Deployment Fails

**Option 1: Instant Rollback** (Vercel)
```bash
# 1. Go to Vercel Dashboard → Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
# Time: < 1 minute
```

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys revert
# Time: ~3 minutes
```

**Option 3: Database Rollback** (if migration failed)
```bash
# If migration caused issues:
# 1. Rollback code first (Option 1 or 2)
# 2. Rollback migration:
pnpm prisma migrate resolve --rolled-back <migration-name>

# If data corruption:
# 1. Restore from database backup
# 2. Most cloud providers have automated backups
# 3. Neon: Dashboard → Backups → Restore
```

---

## EMERGENCY CONTACTS

**Services**:
- Vercel Status: https://www.vercel-status.com
- Clerk Status: https://status.clerk.com
- Stripe Status: https://status.stripe.com
- Upstash Status: https://status.upstash.com
- Neon Status: https://neonstatus.com

**Support**:
- Vercel: support@vercel.com
- Clerk: support@clerk.com
- Stripe: https://support.stripe.com
- Upstash: support@upstash.com
- Neon: support@neon.tech

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing (732/732)
- [ ] Build successful (exit code 0)
- [ ] Staging fully tested
- [ ] Database migrations ready
- [ ] All environment variables documented
- [ ] Rollback plan understood

### During Deployment
- [ ] Database migrations run successfully
- [ ] Build completes without errors
- [ ] SSL certificate provisioned
- [ ] DNS propagated
- [ ] Health check returns 200

### Post-Deployment
- [ ] Critical path test completed
- [ ] Error monitoring configured
- [ ] Rate limiting working
- [ ] Emails sending
- [ ] Stripe webhooks receiving
- [ ] No errors in logs

### Post-Launch (Week 1)
- [ ] Monitor error rates daily
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Address any issues
- [ ] Plan next iteration

---

**Playbook Version**: 1.0
**Last Updated**: 2026-01-24
**Branch**: `claude/treasure-coast-product-spec-aXHT6`
**Commit**: `298d16c`
