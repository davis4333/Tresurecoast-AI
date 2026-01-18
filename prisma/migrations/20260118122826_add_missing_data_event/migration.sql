-- CreateTable
CREATE TABLE "MissingDataEvent" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "botId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "topics" TEXT[],
    "userMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissingDataEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissingDataEvent_organizationId_idx" ON "MissingDataEvent"("organizationId");

-- CreateIndex
CREATE INDEX "MissingDataEvent_workspaceId_idx" ON "MissingDataEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "MissingDataEvent_botId_idx" ON "MissingDataEvent"("botId");

-- CreateIndex
CREATE INDEX "MissingDataEvent_conversationId_idx" ON "MissingDataEvent"("conversationId");

-- CreateIndex
CREATE INDEX "MissingDataEvent_createdAt_idx" ON "MissingDataEvent"("createdAt");
