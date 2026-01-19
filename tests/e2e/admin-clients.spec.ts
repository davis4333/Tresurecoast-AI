import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Admin Client Creation - Step 34", () => {
  const TEST_ORG_NAME = `E2E Test Client ${Date.now()}`;
  const OWNER_USER_ID = `e2e_admin_${Date.now()}`;

  test.afterAll(async () => {
    const org = await prisma.organization.findFirst({
      where: { name: TEST_ORG_NAME },
      include: { bots: true, workspaces: true },
    });

    if (org) {
      await prisma.botKnowledgeSource.deleteMany({ where: { organizationId: org.id } });
      await prisma.botLink.deleteMany({ where: { bot: { organizationId: org.id } } });
      await prisma.auditLog.deleteMany({ where: { organizationId: org.id } });
      await prisma.bot.deleteMany({ where: { organizationId: org.id } });
      await prisma.workspace.deleteMany({ where: { organizationId: org.id } });
      await prisma.businessProfile.deleteMany({ where: { organizationId: org.id } });
      await prisma.organizationMember.deleteMany({ where: { organizationId: org.id } });
      await prisma.organization.delete({ where: { id: org.id } });
    }
  });

  test("POST /api/admin/clients creates org, member, bot, and KB record", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(`${baseURL}/api/admin/clients`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        orgName: TEST_ORG_NAME,
        ownerClerkUserId: OWNER_USER_ID,
        businessName: "E2E Test Business",
        category: "Testing Services",
        phone: "555-TEST",
        address: "123 Test St",
        hours: "24/7",
        websiteUrl: "https://test.example.com",
        bookingUrl: "https://calendly.com/test",
        tone: "friendly",
        primaryGoal: "leads",
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.orgId).toBeGreaterThan(0);
    expect(data.orgPublicId).toBeDefined();
    expect(data.botPublicKey).toBeDefined();
    expect(data.embedSnippet).toContain("script");
    expect(data.embedSnippet).toContain(data.botPublicKey);
    expect(data.iframeSnippet).toContain("iframe");
    expect(data.nextSteps).toContain("Copy the embed snippet");

    const org = await prisma.organization.findUnique({
      where: { id: data.orgId },
      include: {
        members: true,
        bots: true,
        workspaces: true,
        businessProfile: true,
        knowledgeSources: true,
      },
    });

    expect(org).not.toBeNull();
    expect(org!.name).toBe(TEST_ORG_NAME);

    expect(org!.members.length).toBe(1);
    expect(org!.members[0].clerkUserId).toBe(OWNER_USER_ID);
    expect(org!.members[0].role).toBe("AGENCY_OWNER");

    expect(org!.workspaces.length).toBe(1);
    expect(org!.workspaces[0].name).toBe("Default Workspace");

    expect(org!.bots.length).toBe(1);
    expect(org!.bots[0].publicKey).toBe(data.botPublicKey);
    expect(org!.bots[0].name).toContain("E2E Test Business");

    expect(org!.businessProfile).not.toBeNull();
    expect(org!.businessProfile!.businessName).toBe("E2E Test Business");
    expect(org!.businessProfile!.category).toBe("Testing Services");
    expect(org!.businessProfile!.tone).toBe("friendly");
    expect(org!.businessProfile!.primaryGoal).toBe("leads");

    expect(org!.knowledgeSources.length).toBe(1);
    expect(org!.knowledgeSources[0].title).toBe("Business Profile");
    expect(org!.knowledgeSources[0].content).toContain("E2E Test Business");
  });

  test("GET /api/admin/clients returns client list", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/admin/clients`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(Array.isArray(data.clients)).toBe(true);
  });

  test("Admin clients page loads and shows form", async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    await page.goto(`${baseURL}/app/admin/clients`);

    await expect(page.getByTestId("admin-clients-title")).toBeVisible();
    await expect(page.getByTestId("input-org-name")).toBeVisible();
    await expect(page.getByTestId("input-business-name")).toBeVisible();
    await expect(page.getByTestId("select-tone")).toBeVisible();
    await expect(page.getByTestId("button-create-client")).toBeVisible();
  });
});
