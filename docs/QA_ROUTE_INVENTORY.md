# QA Route Inventory

**Generated:** January 20, 2026  
**Purpose:** Complete inventory of all routes for E2E test coverage

---

## Public Routes (Unauthenticated)

| Route | Page File | Description | Priority |
|-------|-----------|-------------|----------|
| `/` | `src/app/(public)/page.tsx` | Landing page | HIGH |
| `/pricing` | `src/app/(public)/pricing/page.tsx` | Pricing tiers | HIGH |
| `/demo` | `src/app/(public)/demo/page.tsx` | Live demo widget | HIGH |
| `/request-demo` | `src/app/(public)/request-demo/page.tsx` | Demo request form | HIGH |
| `/sign-in` | `src/app/sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in | HIGH |
| `/auth-error` | `src/app/auth-error/page.tsx` | Auth error page | LOW |

---

## Widget Routes (Public)

| Route | Page File | Description | Priority |
|-------|-----------|-------------|----------|
| `/widget/[botPublicKey]` | `src/app/widget/[botPublicKey]/page.tsx` | Embeddable chat widget | CRITICAL |
| `/test/embed` | `src/app/test/embed/page.tsx` | Widget embed test page | LOW |

---

## App Routes (Authenticated)

### Dashboard & Core

| Route | Page File | Description | Priority |
|-------|-----------|-------------|----------|
| `/app` | `src/app/app/page.tsx` | Dashboard with KPIs | HIGH |
| `/app/leads` | `src/app/app/leads/page.tsx` | Lead inbox | HIGH |
| `/app/analytics` | `src/app/app/analytics/page.tsx` | Analytics dashboard | HIGH |
| `/app/bots` | `src/app/app/bots/page.tsx` | Bot management | MEDIUM |
| `/app/bots/[botPublicKey]` | `src/app/app/bots/[botPublicKey]/page.tsx` | Bot detail | MEDIUM |
| `/app/conversations` | `src/app/app/conversations/page.tsx` | Conversation list | MEDIUM |
| `/app/kb` | `src/app/app/kb/page.tsx` | Knowledge base | MEDIUM |
| `/app/insights` | `src/app/app/insights/page.tsx` | AI insights | LOW |
| `/app/onboarding` | `src/app/app/onboarding/page.tsx` | Onboarding wizard | MEDIUM |

### Settings

| Route | Page File | Description | Priority |
|-------|-----------|-------------|----------|
| `/app/settings` | `src/app/app/settings/page.tsx` | Settings hub | HIGH |
| `/app/settings/services` | `src/app/app/settings/services/page.tsx` | Service CRUD | HIGH |
| `/app/settings/hours` | `src/app/app/settings/hours/page.tsx` | Business hours | HIGH |
| `/app/settings/branding` | `src/app/app/settings/branding/page.tsx` | Branding settings | MEDIUM |
| `/app/settings/business` | `src/app/app/settings/business/page.tsx` | Business info | MEDIUM |
| `/app/settings/notifications` | `src/app/app/settings/notifications/page.tsx` | Email notifications | HIGH |

### Admin (Super-admin only)

| Route | Page File | Description | Priority |
|-------|-----------|-------------|----------|
| `/app/admin/clients` | `src/app/app/admin/clients/page.tsx` | Client management | HIGH |
| `/app/admin/settings` | `src/app/app/admin/settings/page.tsx` | Admin settings | MEDIUM |

---

## API Routes

### Public API (Unauthenticated)

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/health` | GET | Health check |
| `/api/public/bots/[botPublicKey]` | GET | Get bot config |
| `/api/public/chat` | POST | Send chat message |
| `/api/public/conversations/[id]/messages` | GET | Get conversation messages |
| `/api/public/leads` | POST | Create lead |
| `/api/public/leads/[id]` | PATCH | Update lead |
| `/api/public/leads/recent` | GET | Recent leads |
| `/api/public/leads/status` | POST | Update lead status |
| `/api/public/widget-config` | GET | Widget configuration |
| `/api/public/request-demo` | POST | Demo request submission |
| `/api/public/booking-click` | PATCH | Track booking clicks |

### Admin API (Admin-authenticated)

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/admin/seed` | POST | Seed database |
| `/api/admin/bots` | GET, POST | List/create bots |
| `/api/admin/bots/[botPublicKey]` | GET, PATCH, DELETE | Bot CRUD |
| `/api/admin/insights` | GET | AI insights |
| `/api/admin/clients` | GET, POST | Client management |
| `/api/admin/clients/[orgId]/invite` | POST | Send invite |
| `/api/admin/auth-status` | GET | Auth status check |

### Org API (Org-authenticated)

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/org/branding` | GET, PUT | Branding settings |
| `/api/org/custom-domain` | GET, PUT | Custom domain |
| `/api/org/custom-domain/verify` | POST | Verify domain |
| `/api/org/custom-domain/rotate-token` | POST | Rotate token |
| `/api/org/members` | GET, POST | Member management |
| `/api/org/members/invite` | POST | Send invite |
| `/api/org/members/accept` | POST | Accept invite |
| `/api/org/members/[memberId]` | PATCH, DELETE | Member CRUD |
| `/api/org/onboarding/generate` | POST | Generate content |
| `/api/org/bots/[botPublicKey]/knowledge` | GET, POST | Knowledge sources |
| `/api/org/bots/[botPublicKey]/knowledge/[sourceId]` | GET, PUT, DELETE | Knowledge CRUD |
| `/api/org/settings/services` | GET, PUT | Services CRUD |
| `/api/org/settings/hours` | GET, PUT | Hours CRUD |
| `/api/org/settings/business` | GET, PUT | Business info |
| `/api/org/analytics/overview` | GET | Analytics overview |
| `/api/org/analytics/activity` | GET | Activity data |
| `/api/org/leads` | GET | List leads |
| `/api/org/leads/[leadPublicId]` | GET, PATCH | Lead detail |
| `/api/org/leads/export` | GET | CSV export |
| `/api/org/notifications` | GET, PUT | Notification settings |
| `/api/org/setup-status` | GET | Setup progress |

### User API

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/user/orgs` | GET | User's organizations |
| `/api/user/switch-org` | POST | Switch organization |

---

## Route Coverage Summary

| Category | Count | Coverage Target |
|----------|-------|-----------------|
| Public Pages | 6 | 100% |
| Widget | 2 | 100% |
| App Pages | 15 | 100% |
| Public API | 11 | 100% |
| Admin API | 6 | 100% |
| Org API | 18 | 100% |
| User API | 2 | 100% |
| **Total** | **60** | **100%** |

---

## Test Priority Matrix

### Critical (Must pass before deploy)
- Landing page loads
- Widget chat works
- Booking flow completes
- Lead created in database
- Analytics shows correct counts

### High (Core functionality)
- All public pages load
- All settings pages work
- RBAC enforced correctly
- Tenant isolation holds

### Medium (Important features)
- Knowledge base CRUD
- Bot management
- Conversation history
- Export functionality

### Low (Nice to have)
- Error pages
- Edge cases
- Performance
