-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "brandCompanyName" TEXT,
ADD COLUMN     "brandLogoUrl" TEXT,
ADD COLUMN     "brandPrimaryColor" TEXT NOT NULL DEFAULT '#6366f1',
ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "showPoweredBy" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whiteLabelEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_customDomain_key" ON "Organization"("customDomain");
