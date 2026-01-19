import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Revenue Loop E2E", () => {
  let botPublicKey: string;

  test.beforeAll(async () => {
    const bot = await prisma.bot.findFirst({
      where: { status: "ACTIVE" },
      select: { publicKey: true }
    });

    if (!bot) {
      throw new Error(
        "No ACTIVE bot found in database. Create an ACTIVE bot before running E2E tests."
      );
    }

    botPublicKey = bot.publicKey;
  });

  test("complete revenue flow: chat → lead → status update → fetch", async ({
    request
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const chatResponse = await request.post(`${baseURL}/api/public/chat`, {
      headers: {
        Host: "example.com",
        "Content-Type": "application/json"
      },
      data: {
        botPublicKey,
        message: "What's the price?"
      }
    });

    expect(chatResponse.ok()).toBeTruthy();
    const chatData = await chatResponse.json();
    expect(chatData.ok).toBe(true);
    expect(chatData.conversationPublicId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(chatData.requiresLeadCapture).toBe(true);

    const conversationPublicId = chatData.conversationPublicId;

    const leadResponse = await request.post(`${baseURL}/api/public/leads`, {
      headers: {
        Host: "example.com",
        "Content-Type": "application/json"
      },
      data: {
        botPublicKey,
        conversationPublicId,
        email: "e2e-test@example.com",
        name: "E2E Test User"
      }
    });

    expect(leadResponse.ok()).toBeTruthy();
    const leadData = await leadResponse.json();
    expect(leadData.ok).toBe(true);
    expect(leadData.leadPublicId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    const leadPublicId = leadData.leadPublicId;

    const recentResponse = await request.get(
      `${baseURL}/api/public/leads/recent?botPublicKey=${botPublicKey}&limit=50`,
      {
        headers: { Host: "example.com" }
      }
    );

    expect(recentResponse.ok()).toBeTruthy();
    const recentData = await recentResponse.json();
    expect(recentData.ok).toBe(true);
    expect(Array.isArray(recentData.leads)).toBe(true);

    const foundLead = recentData.leads.find(
      (l: { leadPublicId: string }) => l.leadPublicId === leadPublicId
    );
    expect(foundLead).toBeDefined();
    expect(foundLead.status).toBe("NEW");
    expect(foundLead.conversationPublicId).toBe(conversationPublicId);
    expect(typeof foundLead.score).toBe("number");
    expect(foundLead.score).toBeGreaterThanOrEqual(0);
    expect(foundLead.score).toBeLessThanOrEqual(100);
    expect(["HOT", "WARM", "COLD"]).toContain(foundLead.temperature);

    const statusResponse = await request.patch(
      `${baseURL}/api/public/leads/status`,
      {
        headers: {
          Host: "example.com",
          "Content-Type": "application/json"
        },
        data: {
          botPublicKey,
          leadPublicId,
          status: "CONTACTED"
        }
      }
    );

    expect(statusResponse.ok()).toBeTruthy();
    const statusData = await statusResponse.json();
    expect(statusData.ok).toBe(true);

    const detailResponse = await request.get(
      `${baseURL}/api/public/leads/${leadPublicId}?botPublicKey=${botPublicKey}`,
      {
        headers: { Host: "example.com" }
      }
    );

    expect(detailResponse.ok()).toBeTruthy();
    const detailData = await detailResponse.json();
    expect(detailData.ok).toBe(true);
    expect(detailData.lead.leadPublicId).toBe(leadPublicId);
    expect(detailData.lead.status).toBe("CONTACTED");
    expect(detailData.lead.conversationPublicId).toBe(conversationPublicId);
    expect(detailData.lead.email).toBe("e2e-test@example.com");
    expect(detailData.lead.name).toBe("E2E Test User");
    expect(typeof detailData.lead.createdAt).toBe("string");
    expect(new Date(detailData.lead.createdAt).toISOString()).toBe(
      detailData.lead.createdAt
    );
    expect(typeof detailData.lead.score).toBe("number");
    expect(detailData.lead.score).toBeGreaterThanOrEqual(0);
    expect(detailData.lead.score).toBeLessThanOrEqual(100);
    expect(["HOT", "WARM", "COLD"]).toContain(detailData.lead.temperature);
    expect(Array.isArray(detailData.lead.scoreReasons)).toBe(true);

    const messagesResponse = await request.get(
      `${baseURL}/api/public/conversations/${conversationPublicId}/messages?botPublicKey=${botPublicKey}`,
      {
        headers: { Host: "example.com" }
      }
    );

    expect(messagesResponse.ok()).toBeTruthy();
    const messagesData = await messagesResponse.json();
    expect(messagesData.ok).toBe(true);
    expect(Array.isArray(messagesData.messages)).toBe(true);
    expect(messagesData.messages.length).toBeGreaterThanOrEqual(2);

    for (let i = 1; i < messagesData.messages.length; i++) {
      const prev = new Date(messagesData.messages[i - 1].timestamp);
      const curr = new Date(messagesData.messages[i].timestamp);
      expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
    }

    for (const msg of messagesData.messages) {
      expect(["user", "assistant"]).toContain(msg.role);
      expect(typeof msg.content).toBe("string");
      expect(typeof msg.timestamp).toBe("string");
      expect(new Date(msg.timestamp).toISOString()).toBe(msg.timestamp);
    }

    expect(messagesData.messages[0].role).toBe("user");
    expect(messagesData.messages[0].content).toBe("What's the price?");
  });

  test("onboarding wizard creates bot and shows install section", async ({ page }) => {
    const testUserId = "e2e-onboarding-user-" + Date.now();
    const uniqueBizName = `E2E Biz ${Date.now()}`;

    const orgData = await prisma.organization.findFirst({
      include: { workspaces: true }
    });

    if (!orgData) {
      throw new Error("No organization found. Seed data before running E2E tests.");
    }

    await prisma.organizationMember.upsert({
      where: {
        organizationId_clerkUserId: {
          organizationId: orgData.id,
          clerkUserId: testUserId
        }
      },
      update: { role: "AGENCY_ADMIN" },
      create: {
        organizationId: orgData.id,
        clerkUserId: testUserId,
        role: "AGENCY_ADMIN"
      }
    });

    await page.setExtraHTTPHeaders({
      "X-Test-User-Id": testUserId,
      "X-Org-Public-Id": orgData.publicId
    });

    await page.goto("/app/onboarding", { waitUntil: "networkidle" });

    const bizNameInput = page.locator('[data-testid="input-business-name"]');
    const categoryInput = page.locator('[data-testid="input-category"]');
    const generateButton = page.locator('[data-testid="button-generate-bot"]');

    await expect(bizNameInput).toBeVisible({ timeout: 10000 });
    await expect(categoryInput).toBeVisible();
    await expect(generateButton).toBeVisible();

    await bizNameInput.fill(uniqueBizName);
    await categoryInput.fill("Dental Practice");
    await generateButton.click();

    await page.waitForURL(/\/app\/bots\/[0-9a-f-]+/, { timeout: 15000 });

    const expectedBotName = `${uniqueBizName} Assistant`;
    await expect(page.locator(`text=${expectedBotName}`)).toBeVisible({ timeout: 5000 });

    await expect(page.locator('[data-testid="install-section"]')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('[data-testid="script-embed-snippet"]')).toBeVisible();

    const codeContent = await page.locator('[data-testid="script-embed-snippet"]').inputValue();
    expect(codeContent).toContain("/embed/widget.js");
    expect(codeContent).toContain("data-bot-key");

    await prisma.organizationMember.delete({
      where: {
        organizationId_clerkUserId: {
          organizationId: orgData.id,
          clerkUserId: testUserId
        }
      }
    });
  });

  test("widget UI smoke test", async ({ page }) => {
    await page.goto(`/widget/${botPublicKey}`);

    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="chat-send"]');

    await expect(chatInput).toBeVisible();
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled();

    await chatInput.fill("Test message");
    await expect(sendButton).toBeEnabled();
  });

  test("embed script loads widget iframe", async ({ page }) => {
    await page.goto(`/test/embed?botPublicKey=${botPublicKey}`);

    await expect(page.locator('[data-testid="embed-test-title"]')).toBeVisible();

    await page.waitForSelector("#tca-widget-container", { timeout: 10000 });

    const container = page.locator("#tca-widget-container");
    await expect(container).toBeVisible();

    const launcher = page.locator("#tca-launcher");
    await expect(launcher).toBeVisible();

    await launcher.click();

    const chatFrame = page.locator("#tca-chat-frame");
    await expect(chatFrame).toBeVisible();

    const iframe = chatFrame.locator("iframe");
    await expect(iframe).toBeVisible();

    const iframeSrc = await iframe.getAttribute("src");
    expect(iframeSrc).toContain(`/widget/${botPublicKey}`);
  });
});
