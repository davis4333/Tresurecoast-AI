-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- AlterEnum
ALTER TYPE "DataEventType" ADD VALUE 'LEAD_SCORED';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scoreReasons" JSONB,
ADD COLUMN     "temperature" "LeadTemperature" NOT NULL DEFAULT 'COLD';
