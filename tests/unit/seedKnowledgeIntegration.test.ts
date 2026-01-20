import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { seedTemplateKnowledge } from "@/lib/templates/seedKnowledge";

const TEST_ORG_NAME = "SeedKnowledge_Integration_Test_Org";

describe("seedTemplateKnowledge DB Integration", () => {
  let orgId: number;
  let workspaceId: number;
  let botAId: number;
  let botBId: number;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: { name: TEST_ORG_NAME },
    });
    orgId = org.id;

    const workspace = await prisma.workspace.create({
      data: {
        organizationId: orgId,
        name: "Test Workspace",
      },
    });
    workspaceId = workspace.id;

    const botA = await prisma.bot.create({
      data: {
        organizationId: orgId,
        workspaceId,
        name: "Bot A",
        status: "ACTIVE",
      },
    });
    botAId = botA.id;

    const botB = await prisma.bot.create({
      data: {
        organizationId: orgId,
        workspaceId,
        name: "Bot B",
        status: "ACTIVE",
      },
    });
    botBId = botB.id;
  });

  afterAll(async () => {
    await prisma.botKnowledgeSource.deleteMany({ where: { organizationId: orgId } });
    await prisma.bot.deleteMany({ where: { organizationId: orgId } });
    await prisma.workspace.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.delete({ where: { id: orgId } });
  });

  const templateInput = {
    businessName: "Identical Business Name",
    category: "Barber",
    phone: "555-1234",
    address: "123 Test St",
    hours: "Mon-Fri 9-5",
  };

  it("seeds KB to two different bots with same contentHash/title", async () => {
    const resultA = await seedTemplateKnowledge(botAId, orgId, "barber_shop", templateInput);
    const resultB = await seedTemplateKnowledge(botBId, orgId, "barber_shop", templateInput);

    expect(resultA.created).toBeGreaterThan(0);
    expect(resultB.created).toBeGreaterThan(0);

    const kbA = await prisma.botKnowledgeSource.findMany({ where: { botId: botAId } });
    const kbB = await prisma.botKnowledgeSource.findMany({ where: { botId: botBId } });

    expect(kbA.length).toBeGreaterThanOrEqual(1);
    expect(kbB.length).toBeGreaterThanOrEqual(1);
    expect(kbA.length).toBe(kbB.length);
  });

  it("is idempotent - running twice on same bot does not duplicate rows", async () => {
    const countBefore = await prisma.botKnowledgeSource.count({ where: { botId: botAId } });

    const result = await seedTemplateKnowledge(botAId, orgId, "barber_shop", templateInput);

    const countAfter = await prisma.botKnowledgeSource.count({ where: { botId: botAId } });

    expect(result.skipped).toBeGreaterThan(0);
    expect(result.created).toBe(0);
    expect(countAfter).toBe(countBefore);
  });
});
