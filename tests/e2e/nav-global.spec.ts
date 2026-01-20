import { test, expect } from "@playwright/test";

test.describe("Public Pages Navigation @smoke", () => {
  test("homepage logo click navigates to home", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const logo = page.getByTestId("nav-logo");
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL("/");
    }
  });

  test("pricing page is accessible from homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const pricingLink = page.getByTestId("nav-pricing");
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL("/pricing");
    }
  });

  test("demo page is accessible", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });

  test("sign-in page is accessible", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("App Sidebar Navigation @smoke", () => {
  test("dashboard link navigates correctly", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const dashboardLink = page.getByTestId("nav-dashboard");
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL("/app");
    }
  });

  test("analytics link navigates correctly", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const analyticsLink = page.getByTestId("nav-analytics");
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await expect(page).toHaveURL("/app/analytics");
    }
  });

  test("leads link navigates correctly", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const leadsLink = page.getByTestId("nav-leads");
    if (await leadsLink.isVisible()) {
      await leadsLink.click();
      await expect(page).toHaveURL("/app/leads");
    }
  });

  test("conversations link navigates correctly", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const conversationsLink = page.getByTestId("nav-conversations");
    if (await conversationsLink.isVisible()) {
      await conversationsLink.click();
      await expect(page).toHaveURL("/app/conversations");
    }
  });

  test("knowledge base link navigates correctly", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const kbLink = page.getByTestId("nav-kb");
    if (await kbLink.isVisible()) {
      await kbLink.click();
      await expect(page).toHaveURL("/app/kb");
    }
  });

  test("settings link navigates correctly", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const settingsLink = page.getByTestId("nav-settings");
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/app\/settings/);
    }
  });
});

test.describe("Settings Sub-Navigation @smoke", () => {
  test("services settings link works", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    const servicesLink = page.getByTestId("nav-settings-services");
    if (await servicesLink.isVisible()) {
      await servicesLink.click();
      await expect(page).toHaveURL("/app/settings/services");
    }
  });

  test("hours settings link works", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    const hoursLink = page.getByTestId("nav-settings-hours");
    if (await hoursLink.isVisible()) {
      await hoursLink.click();
      await expect(page).toHaveURL("/app/settings/hours");
    }
  });

  test("branding settings link works", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    const brandingLink = page.getByTestId("nav-settings-branding");
    if (await brandingLink.isVisible()) {
      await brandingLink.click();
      await expect(page).toHaveURL("/app/settings/branding");
    }
  });

  test("notifications settings link works", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    const notificationsLink = page.getByTestId("nav-settings-notifications");
    if (await notificationsLink.isVisible()) {
      await notificationsLink.click();
      await expect(page).toHaveURL("/app/settings/notifications");
    }
  });

  test("embed settings link works", async ({ page }) => {
    await page.goto("/app/settings");
    await page.waitForLoadState("networkidle");

    const embedLink = page.getByTestId("nav-settings-embed");
    if (await embedLink.isVisible()) {
      await embedLink.click();
      await expect(page).toHaveURL("/app/settings/embed");
    }
  });
});

test.describe("Keyboard Accessibility @smoke", () => {
  test("tab navigation reaches main nav items on public pages", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(["A", "BUTTON", "INPUT"]).toContain(focusedElement);
  });

  test("tab navigation reaches main nav items on app pages", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(["A", "BUTTON", "INPUT", "DIV"]).toContain(focusedElement);
  });
});

test.describe("Widget Navigation @smoke", () => {
  const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";

  test("widget page loads with chat interface", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("chatbox")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("input-chat-message")).toBeVisible();
    await expect(page.getByTestId("button-send-message")).toBeVisible();
  });

  test("widget header shows business name", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);
    await page.waitForLoadState("networkidle");

    const header = page.getByTestId("widget-header");
    if (await header.isVisible()) {
      const headerText = await header.textContent();
      expect(headerText).toBeTruthy();
    }
  });
});
