import { test, expect } from "@playwright/test";

const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";

test.describe("Visual Regression - Public Pages @visual", () => {
  test("homepage visual baseline", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      document
        .querySelectorAll("[data-testid*='timestamp'], time")
        .forEach((el) => {
          el.textContent = "2024-01-01";
        });
    });

    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      mask: [page.locator("[data-testid*='id-'], [data-testid*='uuid']")],
    });
  });

  test("pricing page visual baseline", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("pricing.png", {
      fullPage: true,
    });
  });

  test("demo page visual baseline", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("demo.png", {
      fullPage: true,
      mask: [page.locator("[data-testid*='timestamp']")],
    });
  });
});

test.describe("Visual Regression - App Pages @visual", () => {
  test("dashboard visual baseline", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      document.querySelectorAll("time, [data-testid*='date']").forEach((el) => {
        el.textContent = "2024-01-01";
      });
    });

    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
      mask: [
        page.locator("[data-testid*='timestamp']"),
        page.locator("[data-testid*='uuid']"),
      ],
    });
  });

  test("analytics page visual baseline", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      document.querySelectorAll("time, [data-testid*='date']").forEach((el) => {
        el.textContent = "2024-01-01";
      });
    });

    await expect(page).toHaveScreenshot("analytics.png", {
      fullPage: true,
      mask: [
        page.locator("[data-testid*='timestamp']"),
        page.locator("[data-testid*='uuid']"),
      ],
    });
  });

  test("leads page visual baseline", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      document.querySelectorAll("time, [data-testid*='date']").forEach((el) => {
        el.textContent = "2024-01-01";
      });
    });

    await expect(page).toHaveScreenshot("leads.png", {
      fullPage: true,
      mask: [
        page.locator("[data-testid*='timestamp']"),
        page.locator("[data-testid*='uuid']"),
        page.locator("[data-testid*='lead-']"),
      ],
    });
  });
});

test.describe("Visual Regression - Settings Pages @visual", () => {
  test("settings main page visual baseline", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("settings.png", {
      fullPage: true,
    });
  });

  test("services settings visual baseline", async ({ page }) => {
    await page.goto("/app/settings/services");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("settings-services.png", {
      fullPage: true,
      mask: [page.locator("[data-testid*='service-id-']")],
    });
  });

  test("hours settings visual baseline", async ({ page }) => {
    await page.goto("/app/settings/hours");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("settings-hours.png", {
      fullPage: true,
    });
  });
});

test.describe("Visual Regression - Widget @visual", () => {
  test("widget visual baseline", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      document
        .querySelectorAll("time, [data-testid*='timestamp']")
        .forEach((el) => {
          el.textContent = "2024-01-01";
        });
    });

    await expect(page).toHaveScreenshot("widget.png", {
      fullPage: true,
      mask: [
        page.locator("[data-testid*='message-id-']"),
        page.locator("[data-testid*='conversation-id']"),
      ],
    });
  });

  test("widget with chat message visual", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);
    await page.waitForLoadState("networkidle");

    const chatInput = page.getByTestId("input-chat-message");
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill("Hello");
    await page.getByTestId("button-send-message").click();
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      document
        .querySelectorAll("time, [data-testid*='timestamp']")
        .forEach((el) => {
          el.textContent = "2024-01-01";
        });
    });

    await expect(page).toHaveScreenshot("widget-with-message.png", {
      fullPage: true,
      mask: [
        page.locator("[data-testid*='message-id-']"),
        page.locator("[data-testid*='conversation-id']"),
        page.locator(".tca-bubble-assistant"),
      ],
    });
  });
});
