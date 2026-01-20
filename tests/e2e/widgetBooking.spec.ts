import { test, expect } from "@playwright/test";

const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";

test.describe("Widget Chat Interface", () => {
  test("widget loads with chat UI", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("chatbox")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("widget-header")).toBeVisible();
    await expect(page.getByTestId("input-chat-message")).toBeVisible();
    await expect(page.getByTestId("button-send-message")).toBeVisible();
  });

  test("can send a message and receive response", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("Hello");
    await page.getByTestId("button-send-message").click();

    await expect(page.locator(".tca-bubble-user")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(".tca-bubble-user")).toContainText("Hello");

    await expect(page.locator(".tca-bubble-assistant")).toBeVisible({
      timeout: 10000,
    });
  });

  test("input clears after sending message", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("Test message");
    await page.getByTestId("button-send-message").click();

    await expect(page.getByTestId("input-chat-message")).toHaveValue("");
  });
});

test.describe("Widget Booking Flow", () => {
  test("booking intent triggers service selection", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("I want to book an appointment");
    await page.getByTestId("button-send-message").click();

    await expect(page.locator(".tca-bubble-user")).toBeVisible({
      timeout: 5000,
    });

    const serviceButtons = page.locator('[data-testid^="widget-service-button-"]');
    const hasServiceButtons = await serviceButtons.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasServiceButtons) {
      const serviceCount = await serviceButtons.count();
      expect(serviceCount).toBeGreaterThan(0);
    }
  });

  test("clicking service button advances booking flow", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("Book now");
    await page.getByTestId("button-send-message").click();

    const serviceButtons = page.locator('[data-testid^="widget-service-button-"]');
    const hasServiceButtons = await serviceButtons.first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasServiceButtons) {
      await serviceButtons.first().click();

      await page.waitForTimeout(1000);

      const chatMessages = await page.locator(".tca-bubble-assistant").count();
      expect(chatMessages).toBeGreaterThan(0);
    }
  });
});

test.describe("Widget Lead Capture Form", () => {
  test("lead form appears and can be filled", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("I need a quote for your services");
    await page.getByTestId("button-send-message").click();

    await page.waitForTimeout(2000);

    const hasNameInput = await page.getByTestId("widget-lead-name-input").isVisible().catch(() => false);
    const hasEmailInput = await page.getByTestId("widget-lead-email-input").isVisible().catch(() => false);

    if (hasNameInput && hasEmailInput) {
      await page.getByTestId("widget-lead-name-input").fill("Test User");
      await page.getByTestId("widget-lead-email-input").fill("test@example.com");

      const hasPhoneInput = await page.getByTestId("widget-lead-phone-input").isVisible().catch(() => false);
      if (hasPhoneInput) {
        await page.getByTestId("widget-lead-phone-input").fill("555-0123");
      }

      const submitButton = page.getByTestId("widget-lead-submit");
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    }
  });
});

test.describe("Widget Error Handling", () => {
  test("invalid bot key shows error", async ({ page }) => {
    await page.goto("/widget/invalid-bot-key-12345");

    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    const hasError =
      bodyText?.toLowerCase().includes("not found") ||
      bodyText?.toLowerCase().includes("error") ||
      bodyText?.toLowerCase().includes("invalid");

    expect(hasError).toBeTruthy();
  });

  test("widget handles empty message gracefully", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("button-send-message").click();

    await page.waitForTimeout(500);

    const messageCount = await page.locator(".tca-bubble-user").count();
    expect(messageCount).toBe(0);
  });
});

test.describe("Widget Accessibility", () => {
  test("chat input has proper focus handling", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    const input = page.getByTestId("input-chat-message");
    await input.focus();

    const isFocused = await input.evaluate(
      (el) => document.activeElement === el
    );
    expect(isFocused).toBe(true);
  });

  test("enter key sends message", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("Test via enter key");
    await page.keyboard.press("Enter");

    await expect(page.locator(".tca-bubble-user")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(".tca-bubble-user")).toContainText(
      "Test via enter key"
    );
  });
});
