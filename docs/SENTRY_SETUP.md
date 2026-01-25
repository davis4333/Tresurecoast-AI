# Sentry Setup Guide - Treasure Coast AI

**Version**: 1.0
**Date**: 2026-01-25
**Status**: Production Ready

## Overview

Sentry provides real-time error tracking and performance monitoring for Treasure Coast AI. This guide covers setup, configuration, testing, and best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Variables](#environment-variables)
4. [Configuration Files](#configuration-files)
5. [Testing](#testing)
6. [Usage](#usage)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Sentry account (sign up at https://sentry.io)
- Project created in Sentry
- Auth token for source map uploads (optional but recommended)

## Initial Setup

### 1. Create Sentry Project

1. Log in to https://sentry.io
2. Create new project or use existing
3. Select platform: **Next.js**
4. Note your DSN (Data Source Name)

### 2. Install Dependencies

Already installed via PR #5:

```bash
pnpm add @sentry/nextjs
```

### 3. Get Required Values

From Sentry dashboard:

- **DSN**: Project Settings → Client Keys (DSN)
- **Auth Token**: Settings → Auth Tokens → Create New Token
  - Scopes: `project:read`, `project:releases`, `org:read`
- **Organization Slug**: Settings → General Settings → Organization Slug
- **Project Slug**: Project Settings → General Settings → Project Slug

## Environment Variables

### Local Development (.env.local)

```bash
# Sentry Configuration
# Client-side (public, exposed to browser)
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project]"

# Server-side (private)
SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project]"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="your-auth-token"

# Optional: Environment identification
NEXT_PUBLIC_VERCEL_ENV="development"
```

### Staging (.env.staging or Vercel Environment Variables)

```bash
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project]"
SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project]"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="your-auth-token"
NEXT_PUBLIC_VERCEL_ENV="preview"
```

### Production (Vercel Environment Variables)

```bash
NEXT_PUBLIC_SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project]"
SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project]"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="your-auth-token"
NEXT_PUBLIC_VERCEL_ENV="production"
```

### Setting Environment Variables in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable with appropriate scope (Production, Preview, Development)
3. Redeploy to apply changes

## Configuration Files

### Client Configuration (sentry.client.config.ts)

**Features**:
- Session Replay (10% sampling in production, 0% in dev)
- Replay on Error (100% when errors occur)
- Sensitive data masking
- Localhost filtering
- Common error ignoring (browser extensions, network errors)

**Sample Rate**:
- Production: 10% of transactions (adjustable)
- Development: 100% of transactions

### Server Configuration (sentry.server.config.ts)

**Features**:
- Server-side error tracking
- Request data scrubbing (auth headers, cookies, API keys)
- Query parameter sanitization
- Sensitive field removal
- Environment tagging

**Sample Rate**:
- Production: 10% of transactions (adjustable)
- Development: 100% of transactions

### Edge Configuration (sentry.edge.config.ts)

**Features**:
- Edge runtime error tracking
- Middleware error capture
- Header scrubbing
- Environment tagging

### Next.js Configuration (next.config.mjs)

**Features**:
- Source map upload
- Tunnel route (`/monitoring`) to bypass ad-blockers
- Tree-shaking of Sentry logger
- Automatic Vercel Cron monitoring
- Hidden source maps in production

## Testing

### Test Endpoint

A test endpoint is available at `/api/test-sentry` (disabled in production):

#### Test Error Reporting

```bash
# Trigger test error
curl "http://localhost:3000/api/test-sentry?type=error"

# Send test message
curl "http://localhost:3000/api/test-sentry?type=message"

# Send custom error with context
curl "http://localhost:3000/api/test-sentry?type=custom"
```

### Manual Testing

#### Client-Side Error

Create a button in a component:

```tsx
import * as Sentry from "@sentry/nextjs";

function TestButton() {
  return (
    <button onClick={() => {
      throw new Error("Test client-side error");
    }}>
      Trigger Error
    </button>
  );
}
```

#### Server-Side Error

In an API route:

```typescript
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    throw new Error("Test server-side error");
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

### Verification Steps

1. **Trigger test errors** using methods above
2. **Check Sentry dashboard**: Issues → Should see new errors within 1-2 minutes
3. **Verify source maps**: Stack traces should show actual file names and line numbers
4. **Check environment tags**: Errors should be tagged with correct environment
5. **Verify sensitive data scrubbing**: No API keys, passwords, or tokens in error details

## Usage

### Basic Error Capture

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  // Handle error
}
```

### Error with Context

```typescript
Sentry.captureException(error, {
  tags: {
    feature: "checkout",
    payment_method: "stripe",
  },
  extra: {
    userId: user.id,
    organizationId: org.id,
    amount: checkoutAmount,
  },
  level: "error", // or "warning", "info", "debug"
});
```

### Capture Messages

```typescript
// Info message
Sentry.captureMessage("User completed onboarding", "info");

// Warning
Sentry.captureMessage("Rate limit approaching", "warning");

// With context
Sentry.captureMessage("High-value lead created", {
  level: "info",
  tags: { lead_score: 95 },
});
```

### Set User Context

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
  // Don't include sensitive data
});
```

### Add Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: "auth",
  message: "User logged in",
  level: "info",
  data: {
    userId: user.id,
    timestamp: new Date().toISOString(),
  },
});
```

### Set Tags

```typescript
Sentry.setTag("page_locale", "en-US");
Sentry.setTag("user_plan", "premium");
```

### Performance Monitoring

```typescript
import * as Sentry from "@sentry/nextjs";

// Start transaction
const transaction = Sentry.startTransaction({
  name: "Process High-Value Lead",
  op: "lead.process",
});

// Add span
const span = transaction.startChild({
  op: "db.query",
  description: "Fetch lead data",
});

// Your code
await fetchLeadData();

span.finish();
transaction.finish();
```

## Best Practices

### DO ✅

1. **Capture exceptions in try-catch blocks**
   ```typescript
   try {
     await operation();
   } catch (error) {
     Sentry.captureException(error);
     // Handle error
   }
   ```

2. **Add contextual information**
   ```typescript
   Sentry.captureException(error, {
     tags: { feature: "billing" },
     extra: { organizationId: org.id },
   });
   ```

3. **Set user context for authenticated users**
   ```typescript
   Sentry.setUser({ id: user.id, email: user.email });
   ```

4. **Use appropriate error levels**
   - `error`: Critical failures
   - `warning`: Non-critical issues
   - `info`: Informational messages
   - `debug`: Debugging information

5. **Filter expected errors** (already configured in `sentry.*.config.ts`)
   - Validation errors
   - Auth errors (401, 403)
   - Network timeouts (transient)

6. **Monitor performance for critical flows**
   - Checkout process
   - Lead creation
   - Chat interactions

### DON'T ❌

1. **Don't log sensitive data**
   ```typescript
   // BAD
   Sentry.captureException(error, {
     extra: {
       password: user.password, // Never do this!
       apiKey: stripeKey,       // Never do this!
     }
   });
   ```

2. **Don't capture every error blindly**
   - Filter expected errors (validation, 404s)
   - Use appropriate sample rates

3. **Don't forget to set environment**
   - Already configured via env vars

4. **Don't capture PII (Personally Identifiable Information)**
   - Phone numbers
   - Credit card details
   - Social security numbers
   - Full names (use user IDs instead)

### Security Considerations

1. **Sensitive Data Scrubbing**: Already configured in all config files
   - Headers: `authorization`, `cookie`, `x-api-key`
   - Query params: `token`, `key`, `password`
   - Extra fields: `password`, `apiKey`, `stripeKey`, `openaiKey`

2. **Source Map Protection**: Hidden in production (see `next.config.mjs`)

3. **Rate Limiting**: Consider in production
   ```typescript
   // In sentry config
   beforeSend(event) {
     // Implement custom rate limiting if needed
     return event;
   }
   ```

## Sentry Dashboard

### Key Sections

1. **Issues**: All errors grouped by similarity
   - View stack traces
   - See affected users
   - Track resolution status

2. **Performance**: Transaction performance monitoring
   - Identify slow endpoints
   - Database query performance
   - Frontend rendering metrics

3. **Releases**: Track errors by deployment
   - Automatically populated via Vercel integration
   - Compare error rates between releases

4. **Alerts**: Configure notifications
   - Email/Slack when error count spikes
   - New issue types detected
   - Performance degradation

### Recommended Alerts

1. **Error Spike**: >10 errors in 5 minutes
2. **New Issue**: First occurrence of new error type
3. **Performance Degradation**: p95 response time >1s
4. **High Volume**: >100 errors per hour

## Troubleshooting

### Issue: No errors appearing in Sentry

**Checks**:
1. Verify DSN is set correctly: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Check Sentry config files are imported
3. Trigger test error: `curl localhost:3000/api/test-sentry?type=error`
4. Check browser console for Sentry initialization errors
5. Verify network requests to Sentry (DevTools → Network → Filter: sentry)

### Issue: Source maps not working

**Checks**:
1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check build logs for source map upload success
3. Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct
4. Check Sentry dashboard: Settings → Source Maps

### Issue: Too many errors

**Solutions**:
1. Increase `ignoreErrors` in Sentry config
2. Reduce `tracesSampleRate` (currently 10% in production)
3. Add filters in `beforeSend` hook
4. Create Sentry filters: Dashboard → Settings → Inbound Filters

### Issue: Performance data not showing

**Checks**:
1. Verify `tracesSampleRate` is >0
2. Check that transactions are being created
3. Verify performance monitoring is enabled in Sentry project settings

### Issue: Sensitive data in errors

**Actions**:
1. Review and update `beforeSend` hooks in config files
2. Add fields to scrubbing lists
3. Use Sentry data scrubbing rules: Settings → Security & Privacy

## Integration with Existing Logging

Sentry complements structured logging (Pino):

### Use Pino for:
- Request/response logging
- Debug information
- Performance metrics
- Audit trails

### Use Sentry for:
- Error tracking and alerting
- Performance monitoring
- User impact analysis
- Release tracking

### Example: Combined Logging

```typescript
import { createLogger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

const log = createLogger("api:checkout");

try {
  log.info("Processing checkout", { sessionId });
  await processCheckout(session);
  log.info("Checkout completed", { sessionId });
} catch (error) {
  // Log to Pino for audit trail
  log.error("Checkout failed", {
    error: error.message,
    sessionId
  });

  // Send to Sentry for alerting
  Sentry.captureException(error, {
    tags: { feature: "checkout" },
    extra: { sessionId },
  });

  throw error;
}
```

## Metrics and Monitoring

### Key Metrics to Track

1. **Error Rate**: Errors per hour/day
2. **Error Resolution Time**: Time from first occurrence to resolved
3. **Affected Users**: Number of unique users experiencing errors
4. **Performance**: p50, p75, p95, p99 response times
5. **Release Health**: Error rates by deployment

### Dashboard Widgets

Recommended Sentry dashboard widgets:

1. Error count over time
2. Top 10 error types
3. Errors by endpoint
4. Performance by endpoint
5. Release comparison

## Maintenance

### Weekly Tasks

- [ ] Review new error types
- [ ] Check error trends
- [ ] Verify alerts are working
- [ ] Review performance metrics

### Monthly Tasks

- [ ] Analyze error patterns
- [ ] Update `ignoreErrors` list if needed
- [ ] Review and adjust sample rates
- [ ] Check source map upload success rate
- [ ] Review user impact metrics

### Quarterly Tasks

- [ ] Review and update alert thresholds
- [ ] Analyze long-term trends
- [ ] Update Sentry SDK if needed
- [ ] Review sensitive data scrubbing effectiveness

## Cost Optimization

### Reduce Costs

1. **Adjust Sample Rates**:
   ```typescript
   // In sentry config
   tracesSampleRate: 0.05, // 5% instead of 10%
   replaysSessionSampleRate: 0.05, // 5% instead of 10%
   ```

2. **Filter More Aggressively**:
   ```typescript
   ignoreErrors: [
     /NetworkError/,
     /TimeoutError/,
     // Add more patterns
   ],
   ```

3. **Use Inbound Filters**: Sentry Dashboard → Settings → Inbound Filters

4. **Set Spike Protection**: Sentry Dashboard → Settings → Spike Protection

## Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Next.js Integration**: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/
- **Session Replay**: https://docs.sentry.io/product/session-replay/
- **Data Scrubbing**: https://docs.sentry.io/data-management/sensitive-data/

## Support

### Internal

- **Documentation**: This file + `/CODEX_DEPLOYMENT_PLAYBOOK.md`
- **Test Endpoint**: `/api/test-sentry` (staging only)

### External

- **Sentry Support**: https://sentry.io/support/
- **Community Forum**: https://forum.sentry.io/
- **GitHub Issues**: https://github.com/getsentry/sentry-javascript/issues

---

**Created**: 2026-01-25
**Last Updated**: 2026-01-25
**Next Review**: After production deployment

## Quick Reference

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SENTRY_DSN="https://..."  # Public client key
SENTRY_DSN="https://..."              # Server key (can be same as public)
SENTRY_ORG="your-org-slug"            # Organization slug
SENTRY_PROJECT="your-project-slug"    # Project slug
SENTRY_AUTH_TOKEN="..."               # Auth token for uploads
```

### Test Commands

```bash
# Test error
curl "http://localhost:3000/api/test-sentry?type=error"

# Test message
curl "http://localhost:3000/api/test-sentry?type=message"

# Test custom
curl "http://localhost:3000/api/test-sentry?type=custom"
```

### Common Captures

```typescript
// Exception
Sentry.captureException(error);

// Message
Sentry.captureMessage("Info message", "info");

// With context
Sentry.captureException(error, {
  tags: { feature: "billing" },
  extra: { userId: "123" },
});

// User
Sentry.setUser({ id: "123", email: "user@example.com" });
```

---

**Sentry integration complete! 🎯**
