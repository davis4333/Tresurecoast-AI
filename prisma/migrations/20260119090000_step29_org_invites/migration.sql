-- Step 29: OrganizationInvite model
-- Idempotent migration: safe to re-run

-- Create OrganizationInvite table if not exists
CREATE TABLE IF NOT EXISTS "OrganizationInvite" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdByClerkUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByClerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add unique constraint on token if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'OrganizationInvite_token_key'
    ) THEN
        ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_token_key" UNIQUE ("token");
    END IF;
END $$;

-- Add FK to Organization if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'OrganizationInvite_organizationId_fkey'
    ) THEN
        ALTER TABLE "OrganizationInvite" 
        ADD CONSTRAINT "OrganizationInvite_organizationId_fkey" 
        FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index on organizationId if not exists
CREATE INDEX IF NOT EXISTS "OrganizationInvite_organizationId_idx" ON "OrganizationInvite"("organizationId");

-- Create index on token if not exists
CREATE INDEX IF NOT EXISTS "OrganizationInvite_token_idx" ON "OrganizationInvite"("token");
