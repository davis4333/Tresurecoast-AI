-- Migration: Add Plan Tier to Organization
-- Generated for: Ship Step S04
-- Purpose: Add FREE/PAID tier system with usage limits

-- Step 1: Create PlanTier enum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'AGENCY', 'ENTERPRISE');

-- Step 2: Add plan fields to Organization table
ALTER TABLE "Organization" ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Organization" ADD COLUMN "planStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Organization" ADD COLUMN "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "conversationsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "conversationsLimit" INTEGER NOT NULL DEFAULT 200;
ALTER TABLE "Organization" ADD COLUMN "botsLimit" INTEGER NOT NULL DEFAULT 1;

-- Step 3: Add index for plan tier queries (optional, for performance)
CREATE INDEX "Organization_planTier_idx" ON "Organization"("planTier");

-- PRODUCTION DEPLOYMENT COMMANDS:
-- pnpm prisma migrate deploy
-- pnpm prisma generate
-- pnpm typecheck
-- pnpm build

-- ROLLBACK (if needed):
-- DROP INDEX "Organization_planTier_idx";
-- ALTER TABLE "Organization" DROP COLUMN "botsLimit";
-- ALTER TABLE "Organization" DROP COLUMN "conversationsLimit";
-- ALTER TABLE "Organization" DROP COLUMN "conversationsThisMonth";
-- ALTER TABLE "Organization" DROP COLUMN "planExpiresAt";
-- ALTER TABLE "Organization" DROP COLUMN "planStartedAt";
-- ALTER TABLE "Organization" DROP COLUMN "planTier";
-- DROP TYPE "PlanTier";
