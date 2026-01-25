# Logging Migration Guide

## Overview

We've added Pino structured logging to replace `console.log/error/warn`. This provides:
- **JSON structured logs** in production
- **Pretty-printed logs** in development
- **Context-aware logging** with child loggers
- **Log levels** (fatal, error, warn, info, debug, trace)
- **Silent in tests** to reduce noise

## Setup Complete

✅ `pino` and `pino-pretty` installed
✅ `/src/lib/logger.ts` created
✅ Logger supports development (pretty) and production (JSON) modes

## Usage Pattern

### Before (console.log)
```typescript
console.log('[api/webhook] Processing event', event.id);
console.error('[api/webhook] Failed:', error);
```

### After (structured logger)
```typescript
import { createLogger } from '@/lib/logger';

const log = createLogger('api:webhook');

log.info({ eventId: event.id, eventType: event.type }, 'Processing event');
log.error({ eventId: event.id, error: error.message }, 'Failed to process');
```

## Migration Checklist

Routes to migrate (priority order):

### P0: Critical Routes (Billing & Core)
- [ ] `src/app/api/billing/webhook/route.ts` (~11 console calls)
- [ ] `src/app/api/public/chat/route.ts` (~3 console calls)
- [ ] `src/app/api/public/leads/route.ts` (~3 console calls)

### P1: Important Routes
- [ ] `src/app/api/public/booking-click/route.ts` (~1 console call)
- [ ] `src/app/api/org/bots/route.ts` (~2 console calls)
- [ ] `src/app/api/billing/checkout/route.ts` (~1 console call)

### P2: Other Routes
- [ ] All remaining API routes (scan with `grep -r "console\." src/app/api`)

## Migration Steps

1. **Import logger at top of file**:
   ```typescript
   import { createLogger } from '@/lib/logger';
   
   const log = createLogger('api:your-route-name');
   ```

2. **Replace console.log → log.info**:
   ```typescript
   // Before
   console.log('[route] Message', data);
   
   // After
   log.info({ ...contextData }, 'Message');
   ```

3. **Replace console.error → log.error**:
   ```typescript
   // Before
   console.error('[route] Error:', error);
   
   // After
   log.error({ error: error.message, stack: error.stack }, 'Error description');
   ```

4. **Replace console.warn → log.warn**:
   ```typescript
   // Before
   console.warn('[route] Warning');
   
   // After
   log.warn({ ...contextData }, 'Warning description');
   ```

## Context Guidelines

Always include relevant context in the first parameter (object):

```typescript
// Good
log.info({ 
  userId: user.id, 
  organizationId: org.id,
  action: 'checkout_completed' 
}, 'Processing checkout');

// Bad
log.info('Processing checkout for user 123 in org 456');
```

## Log Levels

- **fatal**: Application crash (exits process)
- **error**: Error occurred, operation failed
- **warn**: Warning, potential issue
- **info**: General informational messages (default in production)
- **debug**: Debug information (default in development)
- **trace**: Very detailed tracing

## Testing

Logger is silent in test environment (`NODE_ENV=test`) to reduce noise in test output.

## Production

In production (`NODE_ENV=production`):
- Logs are JSON formatted
- Default level: `info`
- Override with `LOG_LEVEL` env var

Example production log:
```json
{
  "level": "info",
  "time": 1706198400000,
  "context": "api:webhook",
  "eventId": "evt_123",
  "eventType": "checkout.session.completed",
  "msg": "Processing event",
  "env": "production"
}
```

## Development

In development (`NODE_ENV=development`):
- Logs are pretty-printed with colors
- Default level: `debug`
- Timestamps in human-readable format

Example development log:
```
[2024-01-25 10:20:00] INFO (api:webhook): Processing event
    eventId: "evt_123"
    eventType: "checkout.session.completed"
```

## Completion

When all routes migrated:
- Run: `grep -r "console\." src/app/api --include="*.ts"` (should return no matches)
- Update: Mark all checkboxes above as complete
- Verify: Test logs in dev (`pnpm dev`) and staging deployment

---

**Created**: 2026-01-25
**Status**: Foundation complete, migration in progress
**Priority**: Complete P0 routes before production launch
