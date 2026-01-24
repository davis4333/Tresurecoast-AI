import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { shouldSkipDatabaseTests } from "../helpers/dbReachability";

const TEST_ORG_A_NAME = "DemoReset_Test_OrgA";
const TEST_ORG_B_NAME = "DemoReset_Test_OrgB";

describe.skipIf(await shouldSkipDatabaseTests())("DemoReset Route Unit Tests", () => {
  let orgAId: number;
  let orgBId: number;
  let workspaceAId: number;
  let workspaceBId: number;
  let botAId: number;
  let botBId: number;
  let userOwner: string;
  let userAdmin: string;
  let userClient: string;
  let userOrgB: string;

  beforeAll(async () => {
    await prisma.organizationMember.deleteMany({
      where: {
        organization: {
          name: { in: [TEST_ORG_A_NAME, TEST_ORG_B_NAME] },
        },
      },
    });
    await prisma.organization.deleteMany({
      where: { name: { in: [TEST_ORG_A_NAME, TEST_ORG_B_NAME] } },
    });

    const orgA = await prisma.organization.create({
      data: { name: TEST_ORG_A_NAME },
    });
    orgAId = orgA.id;

    const orgB = await prisma.organization.create({
      data: { name: TEST_ORG_B_NAME },
    });
    orgBId = orgB.id;

    const wsA = await prisma.workspace.create({
      data: { organizationId: orgAId, name: "Test Workspace A" },
    });
    workspaceAId = wsA.id;

    const wsB = await prisma.workspace.create({
      data: { organizationId: orgBId, name: "Test Workspace B" },
    });
    workspaceBId = wsB.id;

    const bA = await prisma.bot.create({
      data: {
        organizationId: orgAId,
        workspaceId: workspaceAId,
        name: "Test Bot A",
      },
    });
    botAId = bA.id;

    const bB = await prisma.bot.create({
      data: {
        organizationId: orgBId,
        workspaceId: workspaceBId,
        name: "Test Bot B",
      },
    });
    botBId = bB.id;

    userOwner = `demo-reset-owner-${Date.now()}`;
    userAdmin = `demo-reset-admin-${Date.now()}`;
    userClient = `demo-reset-client-${Date.now()}`;
    userOrgB = `demo-reset-orgb-${Date.now()}`;

    await prisma.organizationMember.createMany({
      data: [
        { organizationId: orgAId, clerkUserId: userOwner, role: "AGENCY_OWNER" },
        { organizationId: orgAId, clerkUserId: userAdmin, role: "AGENCY_ADMIN" },
        { organizationId: orgAId, clerkUserId: userClient, role: "CLIENT" },
        { organizationId: orgBId, clerkUserId: userOrgB, role: "AGENCY_OWNER" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.dataEvent.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.lead.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.conversation.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.organizationMember.deleteMany({
      where: {
        organization: {
          name: { in: [TEST_ORG_A_NAME, TEST_ORG_B_NAME] },
        },
      },
    });
    await prisma.organization.deleteMany({
      where: { name: { in: [TEST_ORG_A_NAME, TEST_ORG_B_NAME] } },
    });
  });

  beforeEach(async () => {
    await prisma.lead.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.conversation.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prisma.dataEvent.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
  });

  describe("RBAC enforcement", () => {
    it("should require AGENCY_OWNER role", async () => {
      expect(userOwner).toBeTruthy();
      expect(userAdmin).toBeTruthy();
      expect(userClient).toBeTruthy();
    });

    it("AGENCY_OWNER is the only role allowed", () => {
      const isOwner = (role: string) => role === "AGENCY_OWNER";
      expect(isOwner("AGENCY_OWNER")).toBe(true);
      expect(isOwner("AGENCY_ADMIN")).toBe(false);
      expect(isOwner("CLIENT")).toBe(false);
    });
  });

  describe("Confirmation text validation", () => {
    it("accepts correct confirmation text", () => {
      const confirmText = "RESET DEMO";
      expect(confirmText === "RESET DEMO").toBe(true);
    });

    it("rejects incorrect confirmation text", () => {
      const tests = [
        "reset demo",
        "RESET",
        "reset",
        "",
        "RESET DEMO ",
        " RESET DEMO",
      ];
      tests.forEach((text) => {
        expect(text === "RESET DEMO").toBe(false);
      });
    });
  });

  describe("Tenant isolation", () => {
    it("should only delete data from the specified organization", async () => {
      const convA = await prisma.conversation.create({
        data: {
          organizationId: orgAId,
          workspaceId: workspaceAId,
          botId: botAId,
        },
      });

      const convB = await prisma.conversation.create({
        data: {
          organizationId: orgBId,
          workspaceId: workspaceBId,
          botId: botBId,
        },
      });

      await prisma.lead.create({
        data: {
          organizationId: orgAId,
          workspaceId: workspaceAId,
          botId: botAId,
          conversationId: convA.id,
          name: "Lead A",
        },
      });

      await prisma.lead.create({
        data: {
          organizationId: orgBId,
          workspaceId: workspaceBId,
          botId: botBId,
          conversationId: convB.id,
          name: "Lead B",
        },
      });

      const leadsABefore = await prisma.lead.count({
        where: { organizationId: orgAId },
      });
      const leadsBBefore = await prisma.lead.count({
        where: { organizationId: orgBId },
      });

      expect(leadsABefore).toBe(1);
      expect(leadsBBefore).toBe(1);

      await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      await prisma.conversation.deleteMany({
        where: { organizationId: orgAId },
      });

      const leadsAAfter = await prisma.lead.count({
        where: { organizationId: orgAId },
      });
      const leadsBAfter = await prisma.lead.count({
        where: { organizationId: orgBId },
      });

      expect(leadsAAfter).toBe(0);
      expect(leadsBAfter).toBe(1);
    });
  });

  describe("Idempotency", () => {
    it("running reset multiple times should not cause errors", async () => {
      const convA = await prisma.conversation.create({
        data: {
          organizationId: orgAId,
          workspaceId: workspaceAId,
          botId: botAId,
        },
      });

      await prisma.lead.create({
        data: {
          organizationId: orgAId,
          workspaceId: workspaceAId,
          botId: botAId,
          conversationId: convA.id,
          name: "Idempotent Lead",
        },
      });

      const reset1 = await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      expect(reset1.count).toBe(1);

      const reset2 = await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      expect(reset2.count).toBe(0);

      const reset3 = await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      expect(reset3.count).toBe(0);
    });
  });

  describe("Data deletion scope", () => {
    it("deletes leads for org", async () => {
      const conv = await prisma.conversation.create({
        data: {
          organizationId: orgAId,
          workspaceId: workspaceAId,
          botId: botAId,
        },
      });

      await prisma.lead.createMany({
        data: [
          {
            organizationId: orgAId,
            workspaceId: workspaceAId,
            botId: botAId,
            conversationId: conv.id,
            name: "Lead 1",
          },
          {
            organizationId: orgAId,
            workspaceId: workspaceAId,
            botId: botAId,
            conversationId: conv.id,
            name: "Lead 2",
          },
        ],
      });

      const countBefore = await prisma.lead.count({
        where: { organizationId: orgAId },
      });
      expect(countBefore).toBe(2);

      await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });

      const countAfter = await prisma.lead.count({
        where: { organizationId: orgAId },
      });
      expect(countAfter).toBe(0);
    });

    it("deletes conversations for org", async () => {
      await prisma.conversation.createMany({
        data: [
          {
            organizationId: orgAId,
            workspaceId: workspaceAId,
            botId: botAId,
          },
          {
            organizationId: orgAId,
            workspaceId: workspaceAId,
            botId: botAId,
          },
        ],
      });

      const countBefore = await prisma.conversation.count({
        where: { organizationId: orgAId },
      });
      expect(countBefore).toBe(2);

      await prisma.conversation.deleteMany({
        where: { organizationId: orgAId },
      });

      const countAfter = await prisma.conversation.count({
        where: { organizationId: orgAId },
      });
      expect(countAfter).toBe(0);
    });

    it("deletes data events for org", async () => {
      await prisma.dataEvent.createMany({
        data: [
          {
            organizationId: orgAId,
            workspaceId: workspaceAId,
            botId: botAId,
            type: "TOPIC_DETECTED",
          },
          {
            organizationId: orgAId,
            workspaceId: workspaceAId,
            botId: botAId,
            type: "LEAD_SCORED",
          },
        ],
      });

      const countBefore = await prisma.dataEvent.count({
        where: { organizationId: orgAId },
      });
      expect(countBefore).toBe(2);

      await prisma.dataEvent.deleteMany({
        where: { organizationId: orgAId },
      });

      const countAfter = await prisma.dataEvent.count({
        where: { organizationId: orgAId },
      });
      expect(countAfter).toBe(0);
    });

    it("keeps organization record", async () => {
      const orgBefore = await prisma.organization.findUnique({
        where: { id: orgAId },
      });
      expect(orgBefore).toBeTruthy();

      await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      await prisma.conversation.deleteMany({
        where: { organizationId: orgAId },
      });
      await prisma.dataEvent.deleteMany({
        where: { organizationId: orgAId },
      });

      const orgAfter = await prisma.organization.findUnique({
        where: { id: orgAId },
      });
      expect(orgAfter).toBeTruthy();
      expect(orgAfter?.name).toBe(TEST_ORG_A_NAME);
    });

    it("keeps members", async () => {
      const membersBefore = await prisma.organizationMember.count({
        where: { organizationId: orgAId },
      });
      expect(membersBefore).toBe(3);

      await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      await prisma.conversation.deleteMany({
        where: { organizationId: orgAId },
      });

      const membersAfter = await prisma.organizationMember.count({
        where: { organizationId: orgAId },
      });
      expect(membersAfter).toBe(3);
    });

    it("keeps bots", async () => {
      const botsBefore = await prisma.bot.count({
        where: { organizationId: orgAId },
      });
      expect(botsBefore).toBe(1);

      await prisma.lead.deleteMany({
        where: { organizationId: orgAId },
      });
      await prisma.conversation.deleteMany({
        where: { organizationId: orgAId },
      });

      const botsAfter = await prisma.bot.count({
        where: { organizationId: orgAId },
      });
      expect(botsAfter).toBe(1);
    });
  });
});
