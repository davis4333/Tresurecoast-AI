# Treasure Coast AI - Project Documentation

## Project Overview

Multi-tenant AI chatbot platform for local businesses (starting with barber shops). Agency-managed SaaS where clients get AI-powered lead capture chatbots.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Validation**: Zod
- **Email**: Resend (optional)
- **Rate Limiting**: Upstash Redis (optional)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public marketing pages
│   ├── api/               # API routes
│   │   ├── admin/         # Agency admin endpoints
│   │   ├── org/           # Organization (tenant) endpoints
│   │   ├── public/        # Public widget/chat endpoints
│   │   └── user/          # User-specific endpoints
│   ├── app/               # Authenticated dashboard
│   └── widget/            # Embeddable chat widget
├── components/            # React components
│   ├── branding/          # White-label branding components
│   ├── providers/         # Context providers (QueryProvider)
│   └── tca/               # Design system components
├── lib/                   # Shared utilities
│   ├── admin/             # Admin utilities
│   ├── auth/              # Auth helpers (getOrgContext)
│   ├── booking/           # Booking flow state machine
│   ├── leads/             # Lead scoring
│   ├── notifications/     # Email notifications
│   ├── public/            # Public API helpers
│   ├── truth/             # Truth Mode engine
│   ├── truthMode/         # Knowledge retrieval
│   └── validators/        # Zod schemas
└── styles/                # Global CSS
```

## Key Concepts

### Multi-Tenancy

- Every Organization is a tenant
- Data is isolated by `organizationId` on most models
- `getOrgContext()` enforces tenant access in API routes
- Roles: `AGENCY_OWNER`, `AGENCY_ADMIN`, `CLIENT`

### Truth Mode

The chatbot only answers from verified business data. It never hallucinates:
- Knowledge sources stored in `BotKnowledgeSource`
- `truthEngine.ts` matches questions to verified answers
- Fallback text when no answer is found

### Booking Flow

State machine for guided booking conversations:
- Service selection
- Lead capture
- Booking link presentation
- Tracks funnel events for analytics

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # TypeScript check

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate:dev   # Run migrations (dev)
npm run db:migrate       # Run migrations (prod)
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio

# Testing
npm run test:e2e         # Playwright tests
```

## Environment Variables

See `.env.example` for all variables. Required for production:
- `DATABASE_URL` - PostgreSQL connection
- `CLERK_SECRET_KEY` - Clerk auth
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `NEXT_PUBLIC_APP_URL` - Base URL for the app

## API Conventions

- All routes return `{ ok: boolean, ...data }` or `{ ok: false, error: string, message: string }`
- Org routes use `getOrgContext()` for auth and tenant context
- Public routes check bot status and domain allowlist
- Rate limiting via Upstash Redis (optional)

## Authentication

- Clerk handles auth in production
- `DEV_BYPASS_AUTH=true` for local development without Clerk
- Middleware protects `/app/*` and `/api/admin/*` routes

## Widget Embedding

```html
<script
  src="https://your-domain.com/embed/widget.js"
  data-bot-key="BOT_PUBLIC_KEY"
  data-position="bottom-right"
></script>
```

## Known Limitations

1. **No Stripe Integration**: Billing/subscriptions not implemented yet
2. **No Calendar Integration**: Booking links redirect to external systems
3. **Email Requires Resend**: Set `RESEND_API_KEY` for email notifications
