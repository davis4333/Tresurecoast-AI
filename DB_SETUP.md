# Database Setup Guide

## Overview

Treasure Coast AI requires PostgreSQL 16+ for local development and testing.

## Option 1: Docker Compose (Recommended for Local Development)

If you have Docker installed:

```bash
# Start PostgreSQL
docker-compose up -d

# Verify it's running
docker-compose ps

# Run migrations
pnpm prisma migrate dev

# Check migration status
pnpm prisma migrate status
```

The docker-compose.yml is pre-configured with:
- User: `tca`
- Password: `tca_password`
- Database: `tca_dev`
- Port: `5432`

## Option 2: Managed PostgreSQL (Recommended for CI/Production)

Use a managed PostgreSQL service:

**Popular Options:**
- [Neon](https://neon.tech) - Serverless Postgres with generous free tier
- [Supabase](https://supabase.com) - Open source Firebase alternative with Postgres
- [Railway](https://railway.app) - Simple deployment platform with Postgres
- [Render](https://render.com) - Free PostgreSQL instances

**Setup:**
1. Create a PostgreSQL instance
2. Copy the connection string
3. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

## Option 3: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

1. Create database:
   ```bash
   createdb tca_dev
   ```

2. Update `.env`:
   ```
   DATABASE_URL="postgresql://localhost:5432/tca_dev"
   ```

3. Run migrations:
   ```bash
   pnpm prisma migrate dev
   ```

## Running Migrations

After setting up your database:

```bash
# Generate Prisma Client
pnpm prisma generate

# Run all pending migrations
pnpm prisma migrate dev

# Check migration status
pnpm prisma migrate status

# View database in browser
pnpm prisma studio
```

## Testing

### Unit Tests (No DB Required)

Most unit tests run without a database:

```bash
pnpm test
```

### Integration Tests (DB Required)

Some tests require a running database. They will automatically skip if `DATABASE_URL` is not set.

**To run ALL tests including DB integration tests:**

1. Ensure PostgreSQL is running
2. Ensure `.env` has valid `DATABASE_URL`
3. Run migrations: `pnpm prisma migrate dev`
4. Run tests: `pnpm test`

### CI Mode

In CI environments, set `CI=true`. If `DATABASE_URL` is missing, tests will fail fast instead of silently skipping database tests.

```bash
# Local CI simulation
CI=true pnpm test  # Fails if DATABASE_URL missing

# Normal mode
pnpm test  # Skips DB tests gracefully if DATABASE_URL missing
```

**GitHub Actions CI:**

The project includes a complete CI pipeline (`.github/workflows/ci.yml`) that:
- Runs PostgreSQL 16 as a service container
- Automatically configures `DATABASE_URL` for test database
- Runs migrations with `pnpm prisma migrate deploy`
- Executes all 722 tests (unit + integration) with exit code verification
- Runs Playwright E2E tests (smoke + security)

**CI Database Configuration:**
```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: tca_test
      POSTGRES_PASSWORD: tca_test_password
      POSTGRES_DB: tca_test
    ports:
      - 5432:5432
```

**Wait for Database:**

If you need to wait for PostgreSQL in scripts or CI:
```bash
# Using the wait script
tsx scripts/waitForDb.ts

# Or manually with pg_isready
pg_isready -h localhost -p 5432 -U tca_test
```

## Troubleshooting

### "Can't reach database server at localhost:5432"

1. Check if PostgreSQL is running:
   ```bash
   # Docker:
   docker-compose ps
   
   # Local:
   pg_isready -h localhost -p 5432
   ```

2. Verify DATABASE_URL in `.env`

3. Check firewall/port availability

### "Environment variable not found: DATABASE_URL"

1. Ensure `.env` file exists in project root
2. Verify `DATABASE_URL` is set:
   ```bash
   grep DATABASE_URL .env
   ```

3. Restart your terminal/IDE to reload environment

### Migration Failures

```bash
# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset

# Force re-apply migrations
pnpm prisma migrate deploy --force
```

## Production Deployment

1. Use a managed PostgreSQL service (Neon, Supabase, Railway)
2. Set `DATABASE_URL` in your deployment platform's environment variables
3. Run migrations as part of your build process:
   ```bash
   pnpm prisma migrate deploy
   ```

## Required Environment Variables

For full functionality, set these in `.env`:

```env
# Required - Database
DATABASE_URL="postgresql://..."

# Required - Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Required - Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional - Features
OPENAI_API_KEY="sk-..."           # AI draft generation
STRIPE_SECRET_KEY="sk_..."        # Billing
STRIPE_WEBHOOK_SECRET="whsec_..." # Payment webhooks
RESEND_API_KEY="re_..."           # Email notifications
```

Run `pnpm preflight` to verify your environment is configured correctly.
