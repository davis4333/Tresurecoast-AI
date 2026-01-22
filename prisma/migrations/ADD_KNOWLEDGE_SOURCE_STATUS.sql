-- Migration: add_knowledge_source_status
-- This migration should be run with: pnpm prisma migrate dev --name add_knowledge_source_status

-- Create enum for knowledge source status
CREATE TYPE "KnowledgeSourceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Add status column with default DRAFT
ALTER TABLE "BotKnowledgeSource" 
  ADD COLUMN "status" "KnowledgeSourceStatus" NOT NULL DEFAULT 'DRAFT';

-- Add publishedAt timestamp (nullable)
ALTER TABLE "BotKnowledgeSource" 
  ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Add publishedBy (clerk user ID, nullable)
ALTER TABLE "BotKnowledgeSource" 
  ADD COLUMN "publishedBy" TEXT;

-- Create index on status for query performance
CREATE INDEX "BotKnowledgeSource_status_idx" ON "BotKnowledgeSource"("status");

-- Optional: Set existing entries to PUBLISHED (if desired)
-- UPDATE "BotKnowledgeSource" SET "status" = 'PUBLISHED', "publishedAt" = NOW();
