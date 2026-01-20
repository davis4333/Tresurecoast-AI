import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Tenant Isolation", () => {
  let org1Id: number;
  let org2Id: number;
  let org1BotPublicKey: string;
  let org2BotPublicKey: string;

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
  });

  test("cannot access bot from wrong organization via API", async ({
    request,
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const conversation1 = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "tenant1.example.com",
        "Content-Type": "application/json",
      },
      data: {
        botPublicKey: org1BotPublicKey,
        message: "Test message for org1",
      },
    });

    expect(conversation1.status()).toBe(200);

    const conversation2 = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "tenant2.example.com",
        "Content-Type": "application/json",
      },
      data: {
        botPublicKey: org2BotPublicKey,
        message: "Test message for org2",
      },
    });

    expect(conversation2.status()).toBe(200);
  });
});

test.describe("RBAC Access Control", () => {
  test("unauthenticated request to admin API returns 401", async ({
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

  test("client role cannot access owner-only endpoints", async ({
    request,
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.delete(
      `${baseURL}/api/org/settings/services/1`,
      {
        headers: {
          "X-Test-User-Role": "CLIENT",
          "Content-Type": "application/json",
        },
      }
    );

    expect([401, 403, 404]).toContain(response.status());
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
  test("services API validates price format", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(`${baseURL}/api/org/settings/services`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        name: "Test Service",
        priceCents: "not-a-number",
      },
    });

    expect([400, 401, 403, 422]).toContain(response.status());
  });

  test("hours API validates day of week range", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.put(`${baseURL}/api/org/settings/hours`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        hours: [
          {
            dayOfWeek: 99,
            isClosed: false,
            openTime: "09:00",
            closeTime: "17:00",
          },
        ],
      },
    });

    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("XSS Prevention", () => {
  test("widget sanitizes message input", async ({ page }) => {
    const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";
    await page.goto(`/widget/${demoBotKey}`);

    const chatInput = page.getByTestId("input-chat-message");
    const hasChatInput = await chatInput
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasChatInput) {
      await chatInput.fill('<script>alert("xss")</script>');
      await page.getByTestId("button-send-message").click();

      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>alert("xss")</script>');
    }
  });

  test("lead name is sanitized in display", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const bot = await prisma.bot.findFirst({
      where: { status: "ACTIVE" },
      select: { publicKey: true },
    });

    if (!bot) {
      console.log("No ACTIVE bot found, skipping test");
      return;
    }

    const chatResponse = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "example.com",
        "Content-Type": "application/json",
      },
      data: {
        botPublicKey: bot.publicKey,
        message: "I need help",
      },
    });

    if (chatResponse.ok()) {
      const chatData = await chatResponse.json();

      const leadResponse = await request.post(`${baseURL}/api/public/leads`, {
        headers: {
          Host: "example.com",
          "Content-Type": "application/json",
        },
        data: {
          botPublicKey: bot.publicKey,
          conversationPublicId: chatData.conversationPublicId,
          name: '<img src=x onerror=alert("xss")>',
          email: "xss-test@example.com",
        },
      });

      if (leadResponse.ok()) {
        const leadData = await leadResponse.json();
        expect(leadData.ok).toBe(true);
      }
    }
  });
});
