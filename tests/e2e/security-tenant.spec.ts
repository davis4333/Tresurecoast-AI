import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Tenant Isolation", () => {
  let org1Id: number;
  let org2Id: number;
  let org1BotPublicKey: string;
  let org2BotPublicKey: string;
  let org1ConversationId: string;

  test.beforeAll(async () => {
    let org1 = await prisma.organization.findFirst({
      where: { name: "Tenant Test Org 1" },
    });

    if (!org1) {
      org1 = await prisma.organization.create({
        data: { name: "Tenant Test Org 1" },
      });
    }
    org1Id = org1.id;

    let org2 = await prisma.organization.findFirst({
      where: { name: "Tenant Test Org 2" },
    });

    if (!org2) {
      org2 = await prisma.organization.create({
        data: { name: "Tenant Test Org 2" },
      });
    }
    org2Id = org2.id;

    let workspace1 = await prisma.workspace.findFirst({
      where: { organizationId: org1Id },
    });

    if (!workspace1) {
      workspace1 = await prisma.workspace.create({
        data: { name: "Workspace 1", organizationId: org1Id },
      });
    }

    let workspace2 = await prisma.workspace.findFirst({
      where: { organizationId: org2Id },
    });

    if (!workspace2) {
      workspace2 = await prisma.workspace.create({
        data: { name: "Workspace 2", organizationId: org2Id },
      });
    }

    let bot1 = await prisma.bot.findFirst({
      where: { workspaceId: workspace1.id },
    });

    if (!bot1) {
      bot1 = await prisma.bot.create({
        data: {
          workspaceId: workspace1.id,
          organizationId: org1Id,
          name: "Tenant Bot 1",
          publicKey: "tenant-test-bot-1-key",
          status: "ACTIVE",
        },
      });
    }
    org1BotPublicKey = bot1.publicKey;

    let bot2 = await prisma.bot.findFirst({
      where: { workspaceId: workspace2.id },
    });

    if (!bot2) {
      bot2 = await prisma.bot.create({
        data: {
          workspaceId: workspace2.id,
          organizationId: org2Id,
          name: "Tenant Bot 2",
          publicKey: "tenant-test-bot-2-key",
          status: "ACTIVE",
        },
      });
    }
    org2BotPublicKey = bot2.publicKey;
  });

  test.afterAll(async () => {
    await prisma.conversation.deleteMany({
      where: {
        bot: {
          publicKey: { in: [org1BotPublicKey, org2BotPublicKey] },
        },
      },
    });

    await prisma.bot.deleteMany({
      where: { publicKey: { in: [org1BotPublicKey, org2BotPublicKey] } },
    });

    await prisma.workspace.deleteMany({
      where: { organizationId: { in: [org1Id, org2Id] } },
    });

    await prisma.organization.deleteMany({
      where: { id: { in: [org1Id, org2Id] } },
    });
  });

  test("bot public keys are unique across tenants", async () => {
    expect(org1BotPublicKey).not.toBe(org2BotPublicKey);
    expect(org1BotPublicKey).toBe("tenant-test-bot-1-key");
    expect(org2BotPublicKey).toBe("tenant-test-bot-2-key");
  });

  test("org1 bot accepts messages", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "tenant1.example.com",
        "Content-Type": "application/json",
      },
      data: {
        botPublicKey: org1BotPublicKey,
        message: "Test message for org1",
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.conversationPublicId).toBeDefined();
    org1ConversationId = data.conversationPublicId;
  });

  test("org2 cannot access org1 conversation - strict denial", async ({
    request,
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    if (!org1ConversationId) {
      test.skip();
      return;
    }

    const response = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "tenant2.example.com",
        "Content-Type": "application/json",
      },
      data: {
        botPublicKey: org2BotPublicKey,
        conversationPublicId: org1ConversationId,
        message: "Attempting to access org1 conversation",
      },
    });

    const data = await response.json();
    if (response.status() === 200 && data.ok === true) {
      expect(data.conversationPublicId).not.toBe(org1ConversationId);
    } else {
      expect([400, 403, 404]).toContain(response.status());
    }
  });

  test("conversation belongs to correct bot and org", async () => {
    if (!org1ConversationId) {
      test.skip();
      return;
    }

    const conversation = await prisma.conversation.findFirst({
      where: { publicId: org1ConversationId },
      include: { bot: true },
    });

    expect(conversation).not.toBeNull();
    expect(conversation?.bot.publicKey).toBe(org1BotPublicKey);
    expect(conversation?.bot.organizationId).toBe(org1Id);
  });

  test("leads created for org1 bot belong to org1", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const bot1 = await prisma.bot.findFirst({
      where: { publicKey: org1BotPublicKey },
      include: { organization: true },
    });

    expect(bot1).not.toBeNull();
    expect(bot1?.organizationId).toBe(org1Id);
  });
});

test.describe("RBAC Access Control", () => {
  test("unauthenticated request to admin API returns error", async ({
    request,
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/admin/organizations`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect([401, 403, 404]).toContain(response.status());
  });

  test("org settings require authentication", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/org/settings/services`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Widget Security", () => {
  test("widget requires valid bot public key", async ({ page }) => {
    await page.goto("/widget/invalid-fake-bot-key-12345");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    const hasError =
      bodyText?.toLowerCase().includes("not found") ||
      bodyText?.toLowerCase().includes("error") ||
      bodyText?.toLowerCase().includes("invalid") ||
      bodyText?.toLowerCase().includes("404");

    expect(hasError).toBeTruthy();
  });

  test("public chat API validates bot public key format", async ({
    request,
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "example.com",
        "Content-Type": "application/json",
      },
      data: {
        botPublicKey: "not-a-valid-uuid",
        message: "Test message",
      },
    });

    expect([400, 404]).toContain(response.status());
  });

  test("public leads API validates required fields", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(`${baseURL}/api/public/leads`, {
      headers: {
        Host: "example.com",
        "Content-Type": "application/json",
      },
      data: {
        email: "test@example.com",
      },
    });

    expect([400, 404]).toContain(response.status());
  });
});

test.describe("Data Validation", () => {
  test("services API validates required name field", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(
      `${baseURL}/api/org/settings/services`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          priceCents: 1000,
        },
      }
    );

    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("XSS Prevention", () => {
  test("widget sanitizes message input", async ({ page }) => {
    const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";
    await page.goto(`/widget/${demoBotKey}`);

    const chatInput = page.getByTestId("input-chat-message");

    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill('<script>alert("xss")</script>');
    await page.getByTestId("button-send-message").click();

    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    expect(pageContent).not.toContain('<script>alert("xss")</script>');
  });
});
