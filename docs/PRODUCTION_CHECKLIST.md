# Production Deployment Checklist

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (provided by Replit) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (starts with `pk_`) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (starts with `sk_`) |
| `ADMIN_SEED_KEY` | Yes | Secret key for admin seed endpoint |
| `SESSION_SECRET` | Yes | Session encryption secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL for the application |
| `NEXT_PUBLIC_DEMO_BOT_KEY` | Recommended | UUID of the demo bot for /demo page |
| `DEMO_REQUEST_WEBHOOK_URL` | Optional | Webhook URL for demo request notifications |
| `LEAD_WEBHOOK_URL` | Optional | Webhook URL for new lead notifications |

## Before You Deploy

1. **Remove DEV_BYPASS_AUTH**
   - Ensure `DEV_BYPASS_AUTH` is NOT set in production
   - This variable is ignored in production mode anyway, but remove it for clarity

2. **Verify Clerk Configuration**
   - Confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_`
   - Confirm `CLERK_SECRET_KEY` starts with `sk_`
   - Test sign-in flow in development first

3. **Run Database Migrations**
   ```bash
   pnpm prisma migrate deploy
   ```

4. **Create Demo Bot**
   - Create at least one ACTIVE bot in the database
   - Set `NEXT_PUBLIC_DEMO_BOT_KEY` to its public key UUID

5. **Build Check**
   ```bash
   pnpm build
   ```
   - Ensure build completes without errors

## Smoke Test URLs

After deployment, verify these URLs work:

| URL | Expected Behavior |
|-----|-------------------|
| `/` | Landing page loads with hero section |
| `/pricing` | Pricing tiers display (Starter, Pro, Agency) |
| `/request-demo` | Form accepts input and submits successfully |
| `/demo` | Widget loads and responds to messages |
| `/sign-in` | Clerk sign-in page loads |
| `/app` | Redirects to sign-in if not authenticated |
| `/api/health` | Returns `{ "status": "ok" }` |

## Rollback Instructions

If issues occur after deployment:

1. **Revert Code**
   ```bash
   git revert HEAD
   git push
   ```

2. **Redeploy**
   - Trigger a new deployment from the Replit dashboard

3. **Database Rollback**
   - If migrations caused issues, use Replit's checkpoint system
   - Navigate to the Rollback tab and select a previous checkpoint

## Security Checklist

- [ ] All secrets stored in Replit Secrets (not in .env files)
- [ ] DEV_BYPASS_AUTH is NOT set
- [ ] Clerk invite-only mode enabled (no public sign-up)
- [ ] Rate limiting configured (optional: Upstash Redis)
- [ ] Domain allowlists configured for production bots

## Monitoring

- Demo requests are logged: `[DEMO_REQUEST] name=... email=...`
- New leads are logged: `[NEW_LEAD] orgId=... leadId=...`
- Set up webhooks for real-time notifications to Slack/Discord/etc.
