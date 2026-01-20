# Treasure Coast AI

## Overview

Treasure Coast AI is a lead capture platform built with Next.js 14, designed to help businesses capture leads through embeddable chat widgets. The application provides a multi-tenant architecture where organizations can create workspaces and deploy AI-powered chat bots that can be embedded on external websites.

The core functionality centers around:
- **Chat Widget System**: Embeddable chat interface that external sites can integrate
- **Bot Configuration**: Customizable bots with greetings, fallback text, and domain allowlists
- **Multi-tenant Structure**: Organizations → Workspaces → Bots hierarchy
- **Conversation Management**: Persistent chat sessions tied to bots

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode enabled (`noUncheckedIndexedAccess: true`)
- **Styling**: Tailwind CSS with dark theme (background: #0B0E13, foreground: #F8FAFC)
- **Path Aliases**: `@/*` maps to `./src/*`

### Backend Architecture
- **API Routes**: Next.js Route Handlers in `src/app/api/`
- **Runtime**: Node.js runtime specified for all API routes
- **Public API Layer**: Endpoints under `/api/public/` for widget integration (no auth required)
- **Admin API Layer**: Protected endpoints under `/api/admin/` requiring Clerk authentication

### Authentication
- **Provider**: Clerk (@clerk/nextjs)
- **Middleware**: `src/middleware.ts` protects `/app/*` and `/api/admin/*` routes
- **Pattern**: Invite-only (no public sign-up), sign-in only at `/sign-in`
- **ClerkProvider**: Conditionally loaded in root layout when publishable key exists
- **Admin Helper**: `src/lib/admin/requireClerkAdmin.ts` for API route protection

### API Structure
| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Service health check |
| `POST /api/admin/seed` | Development data seeding (protected) |
| `POST /api/admin/clients` | Create client org+bot+profile in atomic transaction |
| `POST /api/admin/clients/[orgId]/invite` | Generate invite link for client |
| `GET /api/public/bots/[botPublicKey]` | Fetch bot configuration for widgets |
| `POST /api/public/chat` | Handle chat messages from widgets |
| `POST /api/public/request-demo` | Store demo request from public site |

### Data Layer
- **ORM**: Prisma with PostgreSQL
- **Client Pattern**: Singleton pattern in `src/lib/prisma.ts` with global caching for development
- **Entity Hierarchy**: Organizations → Workspaces → Bots → Conversations/Messages
- **Public Keys**: UUIDs used as public identifiers for external-facing resources

### Widget Architecture
- **Route**: `/widget/[botPublicKey]` - Dynamic route for embedding
- **Client Component**: `ChatBox.tsx` handles real-time chat interaction
- **State Management**: Local storage for conversation persistence (`tca_conversation_${botPublicKey}`)
- **Server-Side Config**: Bot configuration fetched server-side before hydration

### Truth Engine Architecture
- **Location**: `src/lib/truth/truthEngine.ts`
- **Types**: `src/lib/truth/types.ts` - Zod schemas for Topic, TruthIntent, TruthResult, SuggestedAction
- **Purpose**: Answers user questions using ONLY verified business data from the bot's configuration
- **Data Sources**: Bot.services, Bot.hours, Bot.businessPhone/Email/Address, BotLink
- **Topic Detection**: `src/lib/public/topicDetect.ts` categorizes queries into 9 topics (SERVICES, PRICING, HOURS, LOCATION, CONTACT, BOOKING, PAYMENT, POLICIES, GENERAL)
- **TruthResult Shape**: `{ reply, intent, confidence, sourcedFrom[], requiresLeadCapture, missingFields[], topic, suggestedActions[] }`
- **Intent Types**: ANSWERED_FROM_PROFILE, MISSING_DATA, BOOK_OR_PAY_REDIRECT, LEAD_CAPTURE
- **Lead Capture**: Triggers on high-intent queries (booking, pricing) when data is missing
- **Analytics**: DataEvent model logs track TOPIC_DETECTED, TRUTH_RESPONSE, MISSING_DATA, LEAD_CAPTURE_TRIGGERED, REDIRECT_CLICK, LEAD_SCORED events

### Lead Scoring Architecture
- **Location**: `src/lib/leads/scoreLead.ts`
- **Schemas**: `src/lib/leads/scoreSchemas.ts` - Zod schemas for LeadScoreInput, LeadScoreResult
- **Purpose**: Rules-based scoring that evaluates lead quality from contact completeness and intent signals
- **Score Range**: 0-100 (clamped)
- **Temperature Thresholds**: HOT ≥70, WARM ≥40, COLD <40
- **Scoring Factors**:
  - Contact completeness: name (+10), email (+15), phone (+20)
  - Service interest: has specific service (+10)
  - High-intent topics: BOOKING/PAYMENT/PRICING (+15 each)
  - Message detail: 50+ chars (+5), 100+ chars (+10)
  - Suggested actions: book/pay actions (+10), has redirect (+5)
  - Missing data penalty: multiple missing fields (-5)
- **Persistence**: score, temperature (enum), scoreReasons (String[]) stored on Lead model
- **Events**: LEAD_SCORED DataEvent logged on lead creation and status updates
- **Recomputation**: Score recomputed on status changes to maintain accuracy

### Key Design Decisions

1. **Public vs Internal APIs**: Clear separation between authenticated admin endpoints and public widget endpoints
2. **UUID Validation**: Shared validation utility in `src/lib/public/uuid.ts` for consistent input sanitization
3. **Idempotent Seeding**: Seed endpoint checks for existing data via AuditLog markers before creating duplicates
4. **Domain Allowlists**: Bots can restrict which domains are allowed to embed the widget
5. **Truth Engine Never Invents**: The chat bot only answers from verified business data, never fabricates information

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via Replit Postgres
- **Prisma**: ORM and migration management
- **Schema Location**: `prisma/schema.prisma`

### Public Site Architecture (Step 35)
- **Route Group**: `src/app/(public)/` for landing, pricing, request-demo, demo pages
- **Layout**: `PublicNav` (sticky header) + `PublicFooter` shared across public pages
- **Demo Mode**: Uses `NEXT_PUBLIC_DEMO_BOT_KEY` env var; dev-only fallback to first ACTIVE bot
- **Demo Key Resolver**: `src/lib/public/demoKey.ts` with `resolveDemoBotKey()` async function
- **DemoRequest Model**: Stores name, email, businessName, phone from demo request form

### Notifications Architecture (Step 36)
- **Location**: `src/lib/notifications/webhooks.ts`
- **Demo Request Logging**: `[DEMO_REQUEST] name=... email=... business=... phone=... id=...`
- **Lead Logging**: `[NEW_LEAD] orgId=... botId=... leadId=... name=... phone=... source=...`
- **Webhook Support**: Optional webhooks via `DEMO_REQUEST_WEBHOOK_URL` and `LEAD_WEBHOOK_URL`
- **Fail-Open**: Webhook failures never block API responses
- **Admin Settings**: `/app/admin/settings` shows auth mode, Clerk keys status, production readiness checklist

### Production Hardening (Step 36)
- **Auth Mode Protection**: DEV_BYPASS_AUTH is ignored in production (NODE_ENV=production)
- **Secure Auth Status API**: `/api/admin/auth-status` returns auth configuration securely
- **Deployment Docs**: `docs/PRODUCTION_CHECKLIST.md` with required env vars, smoke tests, rollback instructions
- **Host Policy**: Public endpoints validate origin/host against bot allowlists
- **Tenant Binding**: `enforceTenantBinding()` prevents cross-tenant access via custom domains

### Organization Settings Architecture (Steps 38-40)
- **Services Model**: `OrganizationService` stores org-level services with name, priceCents, bookingUrl, paymentUrl, displayOrder, isActive
- **Hours Model**: `OrganizationHours` stores org-level business hours with dayOfWeek (0-6), isClosed, openTime, closeTime
- **RBAC Gating**: AGENCY_OWNER/AGENCY_ADMIN always have access; CLIENT access controlled by `Organization.allowClientEdits`
- **Services API**: `GET/POST/PUT/DELETE /api/org/settings/services` - Full CRUD with case-insensitive duplicate prevention
- **Hours API**: `GET/PUT /api/org/settings/hours` - Bulk replace (7-day canonical format)
- **Validation**: `src/lib/validators/orgServices.ts` and `src/lib/validators/orgHours.ts` with Zod schemas
- **Hours Format**: 24h "HH:MM" strings, open time must be < close time, closed days have null times
- **Canonical Response**: Hours API always returns exactly 7 days (0=Sunday through 6=Saturday)
- **Tenant Isolation**: All operations scoped to user's org via `getOrgContext()`
- **Services UI**: `/app/settings/services` - Full CRUD editor with reorder, locked state for restricted clients
- **Hours UI**: `/app/settings/hours` - 7-day grid editor with open/close toggles, time inputs, validation, locked state
- **Hours Helpers**: `src/lib/settings/hoursHelpers.ts` - dayLabel, isValidTime, compareTimes, validateDayRow, normalizeHours, hasChanges, preparePayload
- **Unit Tests**: `tests/unit/orgServices.route.test.ts`, `tests/unit/orgHours.*.test.ts`, `tests/unit/hoursHelpers.test.ts`
- **E2E Tests**: `tests/e2e/services-settings.spec.ts`, `tests/e2e/hours-settings.spec.ts`

### Booking Flow State Machine (Step 42)
- **Location**: `src/lib/booking/*` - Enterprise-grade booking flow module
- **State Machine**: `src/lib/booking/stateMachine.ts` - Pure functional FSM (~650 lines)
  - `transition()` - Main pure function, zero side effects, deterministic
  - `initBookingContext()` - Initialize fresh context
  - `isBookingIntent()`, `isCancel()`, `isRestart()`, `isBack()` - Intent detection
  - Global commands work from any state: cancel (→IDLE), restart (→SERVICE_SELECTION), back (→previous)
  - **NO AI HALLUCINATIONS**: Booking URLs come ONLY from `OrganizationService.bookingUrl/paymentUrl`
- **Types**: `src/lib/booking/types.ts` - 700+ lines of branded types, enums, interfaces
  - `BookingFlowState` enum: IDLE → SERVICE_SELECTION → LEAD_NAME → LEAD_PHONE → LEAD_EMAIL → COMPLETE
  - `ResponseDirectiveType` enum: UI rendering instructions (SHOW_SERVICE_PICKER, ASK_FOR_NAME, etc.)
  - Branded types: `ServiceId`, `EmailAddress`, `PhoneNumber`, `Url` for compile-time safety
  - Type guards: `isBookingFlowState()`, `isResponseDirectiveType()`
  - Config: `BOOKING_FLOW_CONFIG` with validation limits, timeouts, rate limits
  - Keywords: `BOOKING_INTENT_KEYWORDS`, `CANCEL_KEYWORDS`, `RESTART_KEYWORDS`, `BACK_KEYWORDS`
- **Validators**: `src/lib/booking/validators.ts` - 700+ lines of security-hardened validation
  - `validateName()` - Unicode-aware, XSS prevention, 2-100 chars, no consecutive special chars
  - `validatePhone()` - E.164 normalization, 10-15 digits, international support
  - `validateEmail()` - RFC 5322 subset, lowercase normalization, domain validation
  - `validateUrl()` - Protocol allowlist, domain allowlist, HTTPS enforcement
  - `looksLikeServiceSelection()` - Heuristic for distinguishing service names from sentences
  - Sanitization: Unicode NFC normalization, null byte removal, control char stripping
- **Security Features**: XSS prevention, ReDoS prevention, Unicode bypass prevention, null byte injection prevention
- **Compliance Annotations**: GDPR/CCPA/PCI DSS ready, PII handling documented
- **Unit Tests**: `tests/unit/bookingStateMachine.test.ts` (26 tests), `tests/unit/bookingValidators.test.ts` (65 tests), `tests/unit/bookingTypes.test.ts` (21 tests)

### Industry Templates Architecture (Step 37)
- **Location**: `src/lib/templates/*` - All template logic isolated here
- **Types**: `src/lib/templates/types.ts` - TemplateKey, IndustryTemplate, StarterKnowledge, RecommendedLink
- **Registry**: `src/lib/templates/registry.ts` - 7 templates (universal_blank, barber_shop, nail_salon, fitness_gym, dentist, sober_living, epoxy_flooring)
- **Placeholder Engine**: `src/lib/templates/placeholders.ts` - Safe placeholder replacement with graceful degradation
- **Apply Template**: `src/lib/templates/applyTemplate.ts` - applyTemplateToBlueprint(), generateStarterKnowledge(), getTemplateDefaults()
- **KB Seeding**: `src/lib/templates/seedKnowledge.ts` - Dedup-safe seeding via contentHash and title checks
- **Placeholders**: {BusinessName}, {Phone}, {Address}, {Hours}, {Website}, {BookingUrl}, {PaymentsUrl}, {ServiceArea}
- **KB Title Prefix**: Template KB entries use "Template:" prefix for easy identification
- **UI Integration**: Template dropdown in both onboarding wizard (`/app/onboarding`) and admin client creation (`/app/admin/clients`)
- **Schema Updates**: `templateKey` field added to OnboardingFormSchema and CreateClientSchema (default: universal_blank)
- **Unit Tests**: `tests/unit/templates.test.ts` with 32 tests covering registry, placeholders, and template application

### Environment Variables Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (provided by Replit) |
| `ADMIN_SEED_KEY` | Secret key for admin seed endpoint authentication |
| `NEXT_PUBLIC_APP_URL` | Base URL for server-side API calls (e.g., `http://127.0.0.1:3000`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for client-side auth |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side auth |
| `NEXT_PUBLIC_DEMO_BOT_KEY` | (Optional) UUID of demo bot for /demo page |
| `DEMO_REQUEST_WEBHOOK_URL` | (Optional) Webhook URL for demo request notifications |
| `LEAD_WEBHOOK_URL` | (Optional) Webhook URL for new lead notifications |

### Package Manager
- **pnpm**: Version 9.15.0 specified in `packageManager` field
- **Node.js**: Requires version 18.0.0 or higher

### Development Tools
- **ESLint**: Next.js core-web-vitals configuration
- **Prettier**: Code formatting with Tailwind plugin
- **TypeScript**: Strict mode with incremental compilation

### NPM Scripts
| Script | Purpose |
|--------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking |