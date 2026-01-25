# Final Deployment Guide - Treasure Coast AI

**Version**: 1.0
**Date**: 2026-01-25
**Status**: Production Ready

## Overview

This guide provides the complete deployment checklist for taking Treasure Coast AI from development through staging to production. All critical PRs have been implemented and tested.

## Pre-Deployment Status

### ✅ Completed PRs

| PR | Status | Commit | Description |
|----|--------|--------|-------------|
| PR #1 | ✅ Complete | `f9e0b21` | Toast Infrastructure - Replaced alert() with toast notifications |
| PR #2 | ✅ Complete | `1cba477` | Webhook Idempotency - Prevent duplicate webhook processing |
| PR #3 | ✅ Complete | `5b49d0d` | Structured Logging Foundation - Pino logger setup |
| PR #6 | ✅ Complete | `8f8c877` | Backup/Restore Runbook - Comprehensive data safety procedures |
| PR #4 | ✅ Complete | `9d63dd5` | UI Polish - TcaEmptyState component applied to bots/leads |

### ⏸️ Pending PRs

| PR | Status | Estimated | Description |
|----|--------|-----------|-------------|
| PR #5 | Not Started | 2 hours | Sentry Integration - Error tracking and performance monitoring |
| PR #3 (Migration) | Partial | 4 hours | Complete console.log → logger migration (foundation done) |

## Deployment Phases

### Phase 1: Staging Deployment

#### 1.1 Pre-Deployment Checks

```bash
# Ensure all tests pass
pnpm test

# Build verification
pnpm build

# Type checking
pnpm type-check

# Linting
pnpm lint
```

#### 1.2 Database Backup

Before deploying to staging, create a backup:

```bash
# For Neon (automatic PITR available)
# Verify backup retention: 7 days for staging

# Manual backup (optional)
pg_dump ${DATABASE_URL} -F c -f "pre-staging-$(date +%Y%m%d-%H%M%S).dump"
```

See `docs/BACKUP_RESTORE_RUNBOOK.md` for detailed procedures.

#### 1.3 Deploy to Staging

```bash
# Push to staging branch
git push origin claude/treasure-coast-product-spec-aXHT6

# Deploy via Vercel (or your deployment platform)
# Verify deployment URL: https://staging.treasurecoast.ai
```

#### 1.4 Staging Smoke Tests

**Critical Path Testing**:

1. **Authentication Flow**
   - [ ] Sign in with existing account
   - [ ] Sign up new account
   - [ ] Password reset flow

2. **Bot Management**
   - [ ] View bots page
   - [ ] Verify empty state displays correctly (if no bots)
   - [ ] Create bot via admin API
   - [ ] View bot details

3. **Leads Management**
   - [ ] View leads page
   - [ ] Verify empty state displays correctly
   - [ ] Test lead filters (status, temperature, date range)
   - [ ] Export CSV
   - [ ] Update lead status

4. **Billing Flow**
   - [ ] View billing page
   - [ ] Initiate checkout (test mode)
   - [ ] Verify webhook idempotency (trigger duplicate webhook)
   - [ ] Confirm plan upgrade in database
   - [ ] Test subscription cancellation

5. **Toast Notifications**
   - [ ] Trigger billing error → verify toast appears (not alert)
   - [ ] Verify toast styling matches design system

6. **Logging Verification**
   - [ ] Check Vercel logs for structured JSON output
   - [ ] Verify webhook events log properly
   - [ ] Confirm no sensitive data in logs

#### 1.5 Performance Testing

```bash
# Load testing (optional)
artillery quick --count 10 -n 20 https://staging.treasurecoast.ai/api/public/chat
```

#### 1.6 Known Issues / Fixes

Document any issues discovered during staging QA:

| Issue | Severity | Fix | Status |
|-------|----------|-----|--------|
| (none yet) | - | - | - |

### Phase 2: Production Deployment

#### 2.1 Pre-Production Checklist

- [ ] All staging smoke tests passed
- [ ] No critical issues in staging
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] On-call engineer identified
- [ ] Monitoring alerts configured

#### 2.2 Database Backup (Critical!)

```bash
# Create production backup before deployment
pg_dump ${PROD_DATABASE_URL} -F c -b -v -f "prod-pre-deploy-$(date +%Y%m%d-%H%M%S).dump"

# Verify backup file exists and is non-empty
ls -lh prod-pre-deploy-*.dump

# Store backup in secure location (S3, etc.)
aws s3 cp prod-pre-deploy-*.dump s3://backups/treasure-coast/
```

#### 2.3 Deploy to Production

```bash
# Merge to main branch
git checkout main
git merge claude/treasure-coast-product-spec-aXHT6

# Tag release
git tag -a v1.0.0 -m "Production release - Post-audit improvements"

# Push to production
git push origin main --tags

# Verify deployment
# URL: https://treasurecoast.ai
```

#### 2.4 Post-Deployment Verification

**Immediate Checks (within 5 minutes)**:

```bash
# Health check
curl -I https://treasurecoast.ai/api/health

# Webhook endpoint responding
curl -I https://treasurecoast.ai/api/billing/webhook

# Bot public endpoint
curl https://treasurecoast.ai/api/public/chat -H "X-Bot-Key: test"
```

**Critical Path Verification (within 15 minutes)**:

1. [ ] Sign in to production
2. [ ] View bots page
3. [ ] View leads page
4. [ ] Test live chat widget
5. [ ] Verify billing page loads

**Webhook Testing (within 30 minutes)**:

```bash
# Trigger test webhook from Stripe Dashboard
# Verify:
# - Webhook processes successfully
# - Idempotency check works (send duplicate)
# - Audit log created
# - Structured logs appear in monitoring
```

#### 2.5 Monitoring (24 hours)

**Metrics to Monitor**:

- Error rate (target: <1%)
- Response time (target: p95 <500ms)
- Database connection pool (target: <80% utilization)
- Webhook success rate (target: 100%)
- Memory usage (target: <512MB)

**Log Queries**:

```bash
# Vercel logs - Check for errors
vercel logs --prod | grep -i error

# Check webhook processing
vercel logs --prod | grep "billing/webhook"

# Check for duplicate event handling
vercel logs --prod | grep "alreadyProcessed"
```

**Alert Thresholds**:

- 🔴 **P0 Critical**: Error rate >5% for 5 minutes
- 🟡 **P1 High**: Response time p95 >1s for 10 minutes
- 🟢 **P2 Medium**: Memory usage >80% for 15 minutes

### Phase 3: Post-Launch Improvements (P2)

After production is stable for 24 hours, implement remaining improvements:

#### 3.1 PR #5: Sentry Integration

**Estimated**: 2 hours

**Tasks**:
1. Install `@sentry/nextjs`
2. Configure `sentry.client.config.ts` and `sentry.server.config.ts`
3. Add error boundaries to critical components
4. Test error reporting in staging
5. Deploy to production

**Reference**: See `CODEX_DEPLOYMENT_PLAYBOOK.md` for Sentry configuration

#### 3.2 PR #3: Complete Logging Migration

**Estimated**: 4 hours

**Tasks**:
1. Migrate P0 routes (webhook, chat, leads APIs)
2. Migrate P1 routes (booking, bots, checkout APIs)
3. Migrate P2 routes (remaining APIs)
4. Verify no console.log remains: `grep -r "console\." src/app/api`
5. Test structured logs in staging
6. Deploy to production

**Reference**: See `docs/LOGGING_MIGRATION.md` for migration guide

#### 3.3 Additional Improvements

- [ ] Add analytics dashboard for admin
- [ ] Implement email notifications for high-value leads
- [ ] Add Stripe Customer Portal for self-service billing
- [ ] Optimize image loading with Next.js Image
- [ ] Add E2E tests for critical flows

## Rollback Procedures

### Immediate Rollback (Vercel)

```bash
# Via Vercel Dashboard
# 1. Navigate to Deployments
# 2. Find previous stable deployment
# 3. Click "Promote to Production"

# Via CLI
vercel rollback [deployment-url]
```

### Database Rollback

If database migrations were deployed and need rollback:

```bash
# Restore from backup
pg_restore -d ${DATABASE_URL} -c -v prod-pre-deploy-[timestamp].dump

# Or rollback specific migration
cd prisma/migrations
# Manually reverse migration changes
prisma db push
```

**See `docs/BACKUP_RESTORE_RUNBOOK.md` for detailed rollback procedures.**

### Webhook Rollback

If webhook processing is failing:

1. Pause webhooks in Stripe Dashboard temporarily
2. Deploy rollback
3. Verify webhook endpoint responds correctly
4. Re-enable webhooks
5. Monitor for duplicate event handling (idempotency should prevent issues)

## Success Criteria

### Staging Success

- [ ] All smoke tests pass
- [ ] No critical errors in logs
- [ ] Performance metrics within targets
- [ ] Webhook idempotency verified
- [ ] Toast notifications working

### Production Success

- [ ] Zero downtime deployment
- [ ] All post-deployment checks pass
- [ ] Error rate <1% for first 24 hours
- [ ] No customer-reported issues
- [ ] Monitoring alerts configured and working

### 24-Hour Success

- [ ] Error rate remains <1%
- [ ] Response times within SLA (p95 <500ms)
- [ ] All webhooks processing successfully
- [ ] No rollbacks required
- [ ] Backup procedures tested

## Environment Variables

### Required for Production

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="https://treasurecoast.ai"
NEXTAUTH_SECRET="[secure-random-string]"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI
OPENAI_API_KEY="sk-..."

# Optional: Logging
LOG_LEVEL="info"

# Optional: Sentry (after PR #5)
SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="..."
```

### Verification

```bash
# Check all required env vars are set
pnpm check-env  # (if script exists)

# Or manually verify in Vercel Dashboard
# Settings → Environment Variables
```

## Support Contacts

### On-Call Engineer
- **Name**: [Your Name]
- **Phone**: [Phone]
- **Slack**: [Handle]

### Escalation Path
1. **L1**: On-call engineer
2. **L2**: Technical lead
3. **L3**: CTO / Engineering manager

### Vendor Support
- **Vercel**: https://vercel.com/support
- **Stripe**: https://support.stripe.com
- **Neon/Supabase**: [Database provider support]

## Documentation References

- **Deployment Playbook**: `/CODEX_DEPLOYMENT_PLAYBOOK.md`
- **Backup/Restore**: `/docs/BACKUP_RESTORE_RUNBOOK.md`
- **Logging Migration**: `/docs/LOGGING_MIGRATION.md`
- **Project README**: `/README.md`

## Changelog

### v1.0.0 - 2026-01-25

**Implemented**:
- ✅ Toast notification system (no more alert() calls)
- ✅ Webhook idempotency with audit log tracking
- ✅ Structured logging foundation (Pino)
- ✅ Comprehensive backup/restore procedures
- ✅ UI consistency (TcaEmptyState component)

**Pending**:
- ⏸️ Sentry error tracking
- ⏸️ Complete logging migration (26 API routes)

**Fixes**:
- Fixed TypeScript errors in webhook handler
- Fixed toast integration in UpgradeModal
- Improved empty state consistency

---

**Created**: 2026-01-25
**Last Updated**: 2026-01-25
**Next Review**: After production deployment

## Quick Reference

### Emergency Commands

```bash
# Rollback deployment
vercel rollback [url]

# Restore database
pg_restore -d ${DATABASE_URL} -v backup.dump

# Check logs for errors
vercel logs --prod | grep -i error

# Pause Stripe webhooks (if needed)
# Go to: https://dashboard.stripe.com/webhooks
```

### Status Check

```bash
# Application health
curl https://treasurecoast.ai/api/health

# Database connectivity
psql ${DATABASE_URL} -c "SELECT 1"

# Webhook endpoint
curl -I https://treasurecoast.ai/api/billing/webhook
```

### Useful Log Queries

```bash
# Recent errors
vercel logs --prod --since=1h | grep ERROR

# Webhook events
vercel logs --prod | grep "\\[billing/webhook\\]"

# Performance metrics
vercel logs --prod | grep "duration"
```

---

**Ready for staging deployment! 🚀**
