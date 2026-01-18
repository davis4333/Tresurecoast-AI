-- Step 26: Add DNS verification fields for custom domains

ALTER TABLE "Organization" ADD COLUMN "domainVerificationToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "customDomainStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Organization" ADD COLUMN "customDomainVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "customDomainLastCheckedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "customDomainFailureReason" TEXT;
