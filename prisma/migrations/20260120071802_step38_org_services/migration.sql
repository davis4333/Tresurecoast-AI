-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "allowClientEdits" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OrganizationService" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER,
    "bookingUrl" TEXT,
    "paymentUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationService_organizationId_idx" ON "OrganizationService"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationService_organizationId_name_key" ON "OrganizationService"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "OrganizationService" ADD CONSTRAINT "OrganizationService_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
