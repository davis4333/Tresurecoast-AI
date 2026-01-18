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
| `GET /api/public/bots/[botPublicKey]` | Fetch bot configuration for widgets |
| `POST /api/public/chat` | Handle chat messages from widgets |

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

### Key Design Decisions

1. **Public vs Internal APIs**: Clear separation between authenticated admin endpoints and public widget endpoints
2. **UUID Validation**: Shared validation utility in `src/lib/public/uuid.ts` for consistent input sanitization
3. **Idempotent Seeding**: Seed endpoint checks for existing data via AuditLog markers before creating duplicates
4. **Domain Allowlists**: Bots can restrict which domains are allowed to embed the widget

## External Dependencies

### Database
- **PostgreSQL**: Primary data store via Replit Postgres
- **Prisma**: ORM and migration management
- **Schema Location**: `prisma/schema.prisma`

### Environment Variables Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (provided by Replit) |
| `ADMIN_SEED_KEY` | Secret key for admin seed endpoint authentication |
| `NEXT_PUBLIC_APP_URL` | Base URL for server-side API calls (e.g., `http://127.0.0.1:3000`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for client-side auth |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side auth |

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