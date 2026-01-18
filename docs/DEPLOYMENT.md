# Deployment Guide - Treasure Coast AI

This guide covers deploying Treasure Coast AI to Vercel with a managed Postgres database.

## Prerequisites
- Vercel account
- GitHub repository with latest code
- Neon account (or another Postgres provider)

---

## Database Setup (Neon Postgres)

### 1) Create Neon Project
1. Go to https://console.neon.tech
2. Click **New Project**
3. Name: `treasure-coast-ai-prod`
4. Region: choose closest to `us-east-1`
5. Click **Create Project**

### 2) Get Database URL
1. In Neon dashboard, go to **Connection Details**
2. Copy the connection string (starts with `postgresql://`)
3. Save this as `DATABASE_URL`

Example format:
```txt
postgresql://username:password@host/database?sslmode=require
```

### 3) Run Initial Migration (Manual - First Deployment Only)

**CRITICAL: Vercel does NOT automatically run database migrations. You must run migrations manually.**

From your local machine (or a trusted terminal) pointing to the production DB:

```bash
export DATABASE_URL="postgresql://..."
pnpm db:migrate
pnpm db:migrate-verify
```

**WARNING:** Do NOT run seed scripts in production. Seeds are for local dev only.

---

## Vercel Setup

### 1) Import Project
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: Next.js (auto-detected)
4. Root Directory: ./ (default)
5. Build Command: leave default (uses vercel.json)
6. Install Command: leave default (uses vercel.json)

### 2) Configure Environment Variables

In Vercel project settings → Environment Variables, add:

**Required:**

| Variable | Value | Notes |
|----------|-------|-------|
| DATABASE_URL | postgresql://... | From Neon |
| NEXT_PUBLIC_TCA_SALES_BOT_PUBLIC_KEY | uuid | Sales bot publicKey |

**Optional (Rate Limiting):**

| Variable | Value | Notes |
|----------|-------|-------|
| UPSTASH_REDIS_REST_URL | https://...upstash.io | Optional |
| UPSTASH_REDIS_REST_TOKEN | AX... | Optional |

### 3) Deploy

Click **Deploy**. Vercel will:
1. Install dependencies
2. Run Prisma generate (via postinstall)
3. Build the Next.js app
4. Deploy to production

**Note:** Vercel will NOT run database migrations automatically.

---

## Migration Procedure (Release Gate)

### Standard Migration (Schema Change)

1. Create migration locally:
```bash
pnpm prisma migrate dev --name descriptive_name
```

2. Commit migration files:
```bash
git add prisma/migrations
git commit -m "feat: add new migration"
git push
```

3. Run migrations against production DB manually:
```bash
export DATABASE_URL="postgresql://..."
pnpm db:migrate
pnpm db:migrate-verify
```

4. Deploy to Vercel (DB is already migrated).

---

## Smoke Test Checklist (Post-Deploy)

### Public Pages

```bash
curl -I https://your-app.vercel.app/
curl -I https://your-app.vercel.app/pricing
curl -I https://your-app.vercel.app/request-demo
```

Expected: 200 OK

### Widget Config

```bash
curl -i "https://your-app.vercel.app/api/public/widget-config?botPublicKey=YOUR_BOT_UUID" \
  -H "Host: your-app.vercel.app"
```

### Chat Flow

```bash
curl -i -X POST "https://your-app.vercel.app/api/public/chat" \
  -H "Host: your-app.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"botPublicKey":"YOUR_BOT_UUID","message":"What is the price?"}'
```

Expected: 200 OK and leadCaptureRequested: true

---

## Common Issues

### Prisma Client not generated

If the postinstall hook doesn't run for some reason:
```bash
pnpm db:generate
```

### Database connection timeout
- Verify DATABASE_URL
- Confirm Neon is running
- Ensure ?sslmode=require

### Rate limiting not working

Expected unless Upstash vars are set.

### Widget not showing on /pricing

Set NEXT_PUBLIC_TCA_SALES_BOT_PUBLIC_KEY in Vercel env vars.
