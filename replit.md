# Treasure Coast AI

## Overview

Treasure Coast AI is a multi-tenant lead capture platform built with Next.js 14, enabling businesses to deploy and embed AI-powered chat widgets on their websites. The platform provides a hierarchical structure for organizations, workspaces, and bots, focusing on customizable bot configurations, persistent conversation management, and robust lead scoring. Its core purpose is to help businesses capture and qualify leads effectively through intelligent chat interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with a dark theme

### Backend
- **API Routes**: Next.js Route Handlers
- **Runtime**: Node.js
- **API Layers**:
    - `/api/public/` for unauthenticated widget integration
    - `/api/admin/` for authenticated management (Clerk protected)

### Authentication
- **Provider**: Clerk (@clerk/nextjs)
- **Method**: Invite-only, sign-in at `/sign-in`
- **Protection**: Middleware for `/app/*` and `/api/admin/*` routes

### Data Layer
- **ORM**: Prisma with PostgreSQL
- **Pattern**: Singleton Prisma client
- **Hierarchy**: Organizations → Workspaces → Bots → Conversations/Messages
- **Identifiers**: UUIDs for public-facing resources

### Chat Widget
- **Embedding**: Dynamic route `/widget/[botPublicKey]`
- **Interaction**: `ChatBox.tsx` client component
- **Persistence**: Local storage for conversations
- **Configuration**: Server-side fetched bot configuration

### Truth Engine
- **Purpose**: Answers user questions using only verified business data from bot configuration.
- **Topic Detection**: Categorizes queries into 9 topics (SERVICES, PRICING, HOURS, LOCATION, CONTACT, BOOKING, PAYMENT, POLICIES, GENERAL).
- **Intent Types**: ANSWERED_FROM_PROFILE, MISSING_DATA, BOOK_OR_PAY_REDIRECT, LEAD_CAPTURE.
- **Lead Capture**: Triggers for high-intent queries with missing data.
- **Analytics**: Logs various interaction events.

### Lead Scoring
- **Methodology**: Rules-based scoring (0-100)
- **Factors**: Contact completeness, service interest, high-intent topics, message detail, suggested actions, and penalties for missing data.
- **Persistence**: Score, temperature (HOT, WARM, COLD), and reasons stored on the Lead model.

### Booking Flow
- **Architecture**: Enterprise-grade state machine module (`src/lib/booking/*`)
- **State Machine**: Pure functional FSM with states like `IDLE`, `SERVICE_SELECTION`, `LEAD_NAME`, `LEAD_PHONE`, `LEAD_EMAIL`, `COMPLETE`.
- **Validation**: Security-hardened validators for name, phone, email, and URL.
- **Integration**: Processes booking flow within the `/api/public/chat` route, persisting state in `Conversation.bookingState`.

### Industry Templates
- **Registry**: 7 pre-defined templates (e.g., barber_shop, nail_salon) and a blank template.
- **Functionality**: Placeholder replacement, generation of starter knowledge, and default settings.
- **Integration**: Used in onboarding and client creation for quick setup.

### Knowledge Base Management
- **Location**: `/app/kb` - Full CRUD interface for managing bot knowledge sources
- **API**: `/api/org/bots/[botPublicKey]/knowledge` with GET/POST and [sourceId] GET/PUT/DELETE
- **Features**: Title/content editing, content hash deduplication, template source prefixing

### Revenue Attribution & Analytics
- **averageOrderValue**: Optional field on Organization for revenue calculations
- **Analytics API**: Enhanced with revenueInfluencedCents, hotLeadsCount, conversionRate
- **Dashboard**: RevenueMetricsCard displays revenue influenced, hot leads, conversion rate
- **Topic Analytics**: Top topics breakdown already shown in analytics page

### Lead Export
- **Endpoint**: `/api/org/leads/export` - CSV export with all filters
- **Features**: Max 5000 rows, proper CSV escaping, same filters as leads list
- **UI**: Export button on leads page with current filter state

### Setup Progress Tracking
- **Evaluator**: 12 checkpoints across 4 categories (basics/content/engagement/advanced)
- **API**: `/api/org/setup-status` returns progress and next action
- **UI**: SetupStatusCard with visual progress ring on dashboard

### Key Design Decisions
- Clear separation between public and internal APIs.
- Consistent UUID validation.
- Idempotent data seeding.
- Domain allowlists for widget embedding.
- Truth Engine only uses verified data, never fabricates.
- Dedicated booking flow state machine to handle complex user interactions.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store.
- **Prisma**: ORM for database interaction.

### Notifications
- **Webhooks**: Optional integration for demo request and new lead notifications.
- **Email Notifications**: Hot lead and booking click alerts via Resend API.
  - **Provider**: Resend (requires `RESEND_API_KEY` environment variable)
  - **Triggers**: HOT lead creation, booking link clicks
  - **Retry Logic**: 3 attempts with exponential backoff
  - **Logging**: NotificationLog model tracks delivery status per recipient
  - **Settings UI**: `/app/settings/notifications` (RBAC: admin only for updates)
  - **Toggle Controls**: Enable/disable notifications, hot lead alerts, booking click alerts
  - **Multi-recipient**: Supports multiple email addresses per organization

### Environment Variables
- `DATABASE_URL`
- `ADMIN_SEED_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_DEMO_BOT_KEY` (Optional)
- `DEMO_REQUEST_WEBHOOK_URL` (Optional)
- `LEAD_WEBHOOK_URL` (Optional)
- `RESEND_API_KEY` (Optional, for email notifications)

### Package Manager
- **pnpm**: Used for dependency management.