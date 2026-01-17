# Treasure Coast AI

## Overview

Treasure Coast AI is a lead capture platform built with Next.js 14, designed to help businesses collect and manage leads through embeddable chat widgets. The application follows a multi-tenant architecture with Organizations, Workspaces, and Bots as the core entities.

The project is in its foundation phase (Steps 1-3), establishing the core infrastructure with Next.js App Router, Prisma ORM for database access, and a clean TypeScript codebase with strict type checking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode enabled (`noUncheckedIndexedAccess`, `strict: true`)
- **Styling**: Tailwind CSS with dark theme (background: #0B0E13, foreground: #F8FAFC)
- **Path Aliases**: Uses `@/*` mapping to `./src/*` for clean imports

### Backend Architecture
- **API Routes**: Next.js App Router API routes in `src/app/api/`
- **Runtime**: Node.js runtime specified for API routes
- **Key Endpoints**:
  - `/api/health` - Health check endpoint
  - `/api/admin/seed` - Protected seed endpoint for development data
  - `/api/public/bots/[botPublicKey]` - Public bot configuration endpoint

### Data Layer
- **ORM**: Prisma Client
- **Database**: PostgreSQL (via Replit Postgres)
- **Schema Location**: `prisma/schema.prisma`
- **Client Singleton**: Global Prisma instance in `src/lib/prisma.ts` with dev-mode caching to prevent connection exhaustion

### Multi-Tenant Data Model
The application uses a hierarchical structure:
- **Organization** - Top-level tenant with `publicId`
- **Workspace** - Belongs to an Organization with `publicId`
- **Bot** - Belongs to a Workspace with `publicKey` for public identification
- **BotLink** - Links associated with bots (booking URLs, payment URLs)
- **Allowlist** - Domain allowlist for bot embedding

### Widget System
- **Embeddable Widget**: `/widget/[botPublicKey]/page.tsx` serves bot widgets
- **Bot Configuration**: Fetched via public API using bot's public key
- **Domain Allowlist**: Bots can restrict which domains may embed the widget

### Security
- **Admin Seed Protection**: Requires `x-admin-seed-key` header matching `ADMIN_SEED_KEY` environment variable
- **Public Keys**: Bots use UUID public keys for external identification (validated via regex)
- **Widget Isolation**: Widget pages are marked `noindex, nofollow`

## External Dependencies

### Database
- **PostgreSQL**: Primary database via Replit Postgres
- **Connection**: `DATABASE_URL` environment variable (provided by Replit)

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Replit-provided) |
| `ADMIN_SEED_KEY` | Secret key for admin seed endpoint authentication |
| `NEXT_PUBLIC_APP_URL` | Public URL for the application (no trailing slash) |

### Package Manager
- **pnpm**: Version 9.15.0 specified in `packageManager` field
- **Node.js**: Requires >= 18.0.0

### Development Tools
- **ESLint**: Next.js core web vitals configuration
- **Prettier**: With Tailwind CSS plugin for class sorting
- **TypeScript**: Strict configuration with incremental builds

### NPM Scripts
| Script | Purpose |
|--------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:studio` | Open Prisma Studio GUI |