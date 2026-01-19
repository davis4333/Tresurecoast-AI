-- Step 27: real multi-tenant membership + org context linkage

-- 1) Add clerkOrganizationId to Organization (if it doesn't exist in older DBs)
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "clerkOrganizationId" TEXT;

-- 2) Unique index for clerkOrganizationId (Prisma expects uniqueness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Organization_clerkOrganizationId_key'
  ) THEN
    CREATE UNIQUE INDEX "Organization_clerkOrganizationId_key"
    ON "Organization" ("clerkOrganizationId");
  END IF;
END $$;

-- 3) Create OrganizationMember table (if not exists)
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" SERIAL NOT NULL,
  "organizationId" INTEGER NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- 4) Constraints + indexes Prisma expects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'OrganizationMember_organizationId_clerkUserId_key'
  ) THEN
    CREATE UNIQUE INDEX "OrganizationMember_organizationId_clerkUserId_key"
    ON "OrganizationMember"("organizationId","clerkUserId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'OrganizationMember_clerkUserId_idx'
  ) THEN
    CREATE INDEX "OrganizationMember_clerkUserId_idx"
    ON "OrganizationMember"("clerkUserId");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'OrganizationMember_organizationId_idx'
  ) THEN
    CREATE INDEX "OrganizationMember_organizationId_idx"
    ON "OrganizationMember"("organizationId");
  END IF;
END $$;

-- 5) Foreign key (add if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'OrganizationMember'
      AND tc.constraint_name = 'OrganizationMember_organizationId_fkey'
  ) THEN
    ALTER TABLE "OrganizationMember"
      ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
      FOREIGN KEY ("organizationId")
      REFERENCES "Organization"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
