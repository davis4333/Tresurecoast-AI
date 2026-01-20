-- Step 44: Booking Flow Productization
-- Add serviceId to Lead, unique constraint for idempotency, and new DataEventType values

-- Add new DataEventType enum values
ALTER TYPE "DataEventType" ADD VALUE 'BOOKING_SERVICE_SELECTED';
ALTER TYPE "DataEventType" ADD VALUE 'BOOKING_LEAD_CREATED';
ALTER TYPE "DataEventType" ADD VALUE 'BOOKING_LINK_SHOWN';
ALTER TYPE "DataEventType" ADD VALUE 'BOOKING_LINK_CLICKED';

-- Add serviceId column to Lead table (nullable for existing leads)
ALTER TABLE "Lead" ADD COLUMN "serviceId" INTEGER;

-- Add foreign key constraint to OrganizationService
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_serviceId_fkey" 
  FOREIGN KEY ("serviceId") REFERENCES "OrganizationService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index on conversationId for query performance
CREATE INDEX "Lead_conversationId_idx" ON "Lead"("conversationId");

-- Add unique constraint for idempotency: prevents duplicate leads per conversation+service
-- Note: This uses a partial unique index to handle nulls properly
CREATE UNIQUE INDEX "Lead_conversationId_serviceId_key" 
  ON "Lead"("conversationId", "serviceId") 
  WHERE "conversationId" IS NOT NULL AND "serviceId" IS NOT NULL;
