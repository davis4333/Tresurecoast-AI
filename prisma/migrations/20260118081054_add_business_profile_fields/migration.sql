-- AlterTable
ALTER TABLE "Bot" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "hours" JSONB,
ADD COLUMN     "services" JSONB;
