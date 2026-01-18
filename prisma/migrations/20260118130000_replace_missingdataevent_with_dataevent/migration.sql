-- CreateEnum
CREATE TYPE "DataEventType" AS ENUM ('TOPIC_DETECTED', 'MISSING_DATA', 'TRUTH_RESPONSE', 'LEAD_CAPTURE_TRIGGERED', 'REDIRECT_CLICK');

-- DropTable
DROP TABLE "MissingDataEvent";

-- CreateTable
CREATE TABLE "DataEvent" (
    "id" SERIAL NOT NULL,
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "botId" INTEGER NOT NULL,
    "conversationId" INTEGER,
    "type" "DataEventType" NOT NULL,
    "topic" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataEvent_publicId_key" ON "DataEvent"("publicId");

-- CreateIndex
CREATE INDEX "DataEvent_organizationId_idx" ON "DataEvent"("organizationId");

-- CreateIndex
CREATE INDEX "DataEvent_workspaceId_idx" ON "DataEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "DataEvent_botId_idx" ON "DataEvent"("botId");

-- CreateIndex
CREATE INDEX "DataEvent_conversationId_idx" ON "DataEvent"("conversationId");

-- CreateIndex
CREATE INDEX "DataEvent_type_idx" ON "DataEvent"("type");

-- CreateIndex
CREATE INDEX "DataEvent_createdAt_idx" ON "DataEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "DataEvent" ADD CONSTRAINT "DataEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEvent" ADD CONSTRAINT "DataEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataEvent" ADD CONSTRAINT "DataEvent_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
