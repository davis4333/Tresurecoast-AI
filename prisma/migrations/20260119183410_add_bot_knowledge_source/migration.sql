-- CreateTable
CREATE TABLE "BotKnowledgeSource" (
    "id" SERIAL NOT NULL,
    "botId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotKnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotKnowledgeSource_contentHash_key" ON "BotKnowledgeSource"("contentHash");

-- CreateIndex
CREATE INDEX "BotKnowledgeSource_botId_idx" ON "BotKnowledgeSource"("botId");

-- CreateIndex
CREATE INDEX "BotKnowledgeSource_organizationId_idx" ON "BotKnowledgeSource"("organizationId");

-- AddForeignKey
ALTER TABLE "BotKnowledgeSource" ADD CONSTRAINT "BotKnowledgeSource_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotKnowledgeSource" ADD CONSTRAINT "BotKnowledgeSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
