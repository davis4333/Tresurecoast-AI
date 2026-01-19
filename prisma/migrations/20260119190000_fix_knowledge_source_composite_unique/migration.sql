-- DropIndex
DROP INDEX IF EXISTS "BotKnowledgeSource_contentHash_key";

-- CreateIndex
CREATE UNIQUE INDEX "BotKnowledgeSource_botId_contentHash_key" ON "BotKnowledgeSource"("botId", "contentHash");
