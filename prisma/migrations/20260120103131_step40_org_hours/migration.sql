-- CreateTable
CREATE TABLE "OrganizationHours" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationHours_organizationId_idx" ON "OrganizationHours"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationHours_organizationId_dayOfWeek_key" ON "OrganizationHours"("organizationId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "OrganizationHours" ADD CONSTRAINT "OrganizationHours_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
