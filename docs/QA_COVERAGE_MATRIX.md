# QA Coverage Matrix

**Project**: Treasure Coast AI  
**Updated**: January 20, 2026  
**Status**: Ship-Grade Confidence

---

## Test Suite Categories

| Suite | Command | Purpose | Test Count |
|-------|---------|---------|------------|
| Smoke | `pnpm test:e2e:smoke` | Critical paths only | ~20 |
| Security | `pnpm test:e2e:security` | Tenant isolation + RBAC | ~15 |
| Visual | `pnpm test:e2e:visual` | Screenshot baselines | ~10 |
| Full | `pnpm test:e2e:full` | Complete E2E suite | 85+ |
| Unit | `pnpm test` | Vitest unit tests | 626 |

---

## Route Coverage

### Public Routes

| Route | Spec File | Tests | Status |
|-------|-----------|-------|--------|
| `/` | smoke.spec.ts, nav-global.spec.ts, visual.spec.ts | 3 | ✅ |
| `/pricing` | smoke.spec.ts, nav-global.spec.ts, visual.spec.ts | 3 | ✅ |
| `/demo` | smoke.spec.ts, public-pages.spec.ts, visual.spec.ts | 3 | ✅ |
| `/sign-in` | smoke.spec.ts, nav-global.spec.ts | 2 | ✅ |
| `/widget/[botPublicKey]` | widgetBooking.spec.ts, visual.spec.ts | 5 | ✅ |

### App Routes (Authenticated)

| Route | Spec File | Tests | Status |
|-------|-----------|-------|--------|
| `/app` | smoke.spec.ts, nav-global.spec.ts, visual.spec.ts | 4 | ✅ |
| `/app/analytics` | analytics-leads.spec.ts, visual.spec.ts | 6 | ✅ |
| `/app/leads` | analytics-leads.spec.ts, forms-validation.spec.ts | 5 | ✅ |
| `/app/conversations` | smoke.spec.ts, navigation.spec.ts | 2 | ✅ |
| `/app/kb` | smoke.spec.ts, forms-validation.spec.ts | 3 | ✅ |
| `/app/settings` | smoke.spec.ts, visual.spec.ts | 3 | ✅ |
| `/app/settings/services` | services-settings.spec.ts, forms-validation.spec.ts | 6 | ✅ |
| `/app/settings/hours` | hours-settings.spec.ts, forms-validation.spec.ts | 5 | ✅ |
| `/app/settings/branding` | smoke.spec.ts, forms-validation.spec.ts | 3 | ✅ |
| `/app/settings/notifications` | smoke.spec.ts, forms-validation.spec.ts | 3 | ✅ |
| `/app/settings/embed` | smoke.spec.ts, nav-global.spec.ts | 2 | ✅ |

---

## Production Gates Coverage

### Gate 1: Authentication & Authorization
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| Unauthenticated API denial | security-tenant.spec.ts | 401/403 status |
| Org settings auth check | security-tenant.spec.ts | 401/403 status |
| Widget public access | widgetBooking.spec.ts | 200 status |

### Gate 2: Tenant Isolation
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| Cross-tenant conversation denial | security-tenant.spec.ts | 400/403/404 or new ID |
| Conversation ownership DB check | security-tenant.spec.ts | Bot org matches |
| Bot public key uniqueness | security-tenant.spec.ts | Keys are different |

### Gate 3: Widget Embedding
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| Widget loads with chat | widgetBooking.spec.ts, nav-global.spec.ts | chatbox visible |
| Message send/receive | widgetBooking.spec.ts | User + assistant bubbles |
| Invalid bot key handling | security-tenant.spec.ts | Error shown |

### Gate 4: Lead Capture & Scoring
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| Leads table/empty state | analytics-leads.spec.ts | Table or empty-state |
| Lead filters visible | analytics-leads.spec.ts | All filters present |
| Lead export works | analytics-leads.spec.ts | Export button visible |

### Gate 5: Booking Flow
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| Booking interaction in widget | widgetBooking.spec.ts | Chat flow works |
| Service selection | widgetBooking.spec.ts | Message processing |

### Gate 6: Analytics
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| KPI cards display | analytics-leads.spec.ts | analytics-kpi-* visible |
| Date filters work | analytics-leads.spec.ts | Filter buttons present |
| Funnel visualization | analytics-leads.spec.ts | Funnel card visible |

### Gate 7: Email Notifications
| Test Type | Spec File | Assertions |
|-----------|-----------|------------|
| Notifications page loads | forms-validation.spec.ts | Heading visible |
| Email validation | forms-validation.spec.ts | API rejects invalid |

---

## Interaction Coverage

### Forms Tested

| Form | Spec File | Validations |
|------|-----------|-------------|
| Add Service | services-settings.spec.ts, forms-validation.spec.ts | Required name, URL format |
| Hours Settings | hours-settings.spec.ts, forms-validation.spec.ts | Day toggles, time inputs |
| Branding | forms-validation.spec.ts | Hex color format |
| Notifications | forms-validation.spec.ts | Email format |
| Knowledge Base | forms-validation.spec.ts | Required fields |

### Navigation Tested

| Navigation Type | Spec File | Coverage |
|-----------------|-----------|----------|
| Public page nav | nav-global.spec.ts | Logo, pricing link |
| Sidebar nav | nav-global.spec.ts | All main links |
| Settings sub-nav | nav-global.spec.ts | All settings links |
| Keyboard a11y | nav-global.spec.ts | Tab navigation |

---

## Visual Regression Baselines

| Page | Screenshot Name | Status |
|------|-----------------|--------|
| Homepage | homepage.png | Pending |
| Pricing | pricing.png | Pending |
| Demo | demo.png | Pending |
| Dashboard | dashboard.png | Pending |
| Analytics | analytics.png | Pending |
| Leads | leads.png | Pending |
| Settings | settings.png | Pending |
| Services Settings | settings-services.png | Pending |
| Hours Settings | settings-hours.png | Pending |
| Widget | widget.png | Pending |
| Widget with Message | widget-with-message.png | Pending |

---

## Test Configuration

### Artifact Capture
```typescript
trace: "retain-on-failure"
screenshot: "only-on-failure"
video: "retain-on-failure"
outputDir: "test-results"
```

### Timeouts
```typescript
timeout: 60000 // Global test timeout
expect.timeout: 10000 // Assertion timeout
actionTimeout: 15000 // Click/fill timeout
navigationTimeout: 30000 // Page load timeout
```

### Retries
```typescript
retries: process.env.CI ? 2 : 0
```

---

## Reliability Verification

### Run Results

| Run | Date | Result | Notes |
|-----|------|--------|-------|
| 1 | Pending | - | - |
| 2 | Pending | - | - |
| 3 | Pending | - | - |

---

## Quality Gates Checklist

| Gate | Command | Status |
|------|---------|--------|
| Type Check | `pnpm typecheck` | ✅ |
| Unit Tests | `pnpm test` | ✅ 626 pass |
| E2E Smoke | `pnpm test:e2e:smoke` | Pending |
| E2E Security | `pnpm test:e2e:security` | Pending |
| E2E Full (x3) | `pnpm test:e2e:full` | Pending |
| E2E Visual | `pnpm test:e2e:visual` | Pending |
| Build | `pnpm build` | Pending |

---

## Scripts to Add to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:e2e": "playwright test --project=chromium",
    "test:e2e:smoke": "playwright test --project=smoke",
    "test:e2e:security": "playwright test --project=security",
    "test:e2e:visual": "playwright test --project=visual",
    "test:e2e:full": "playwright test --project=chromium",
    "test:e2e:all": "playwright test"
  }
}
```
