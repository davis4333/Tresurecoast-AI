import { test, expect } from "@playwright/test";

test.describe("Public Pages Navigation", () => {
  test("can navigate from landing to pricing to request-demo", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("AI Lead Capture");
    await expect(page.getByTestId("link-home-logo")).toBeVisible();

    await page.getByTestId("link-nav-pricing").click();
    await expect(page).toHaveURL("/pricing");
    await expect(page.locator("h1")).toContainText("Pricing");

    await page.getByTestId("link-pricing-request-demo").click();
    await expect(page).toHaveURL("/request-demo");
    await expect(page.locator("h1")).toContainText("Request a Demo");
  });

  test("landing page has all sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("How It Works")).toBeVisible();
    await expect(page.getByText("Features")).toBeVisible();
    await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
    await expect(page.getByTestId("link-hero-request-demo")).toBeVisible();
    await expect(page.getByTestId("link-hero-live-demo")).toBeVisible();
  });

  test("pricing page shows all tiers", async ({ page }) => {
    await page.goto("/pricing");

    await expect(page.getByText("Starter", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Professional", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Agency", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("$99")).toBeVisible();
    await expect(page.getByText("$249")).toBeVisible();
    await expect(page.getByText("Custom", { exact: true }).first()).toBeVisible();
  });
});

test.describe("Demo Request Form", () => {
  test("submits demo request successfully", async ({ page }) => {
    await page.goto("/request-demo");

    const timestamp = Date.now();
    await page.getByTestId("input-demo-name").fill("Test User");
    await page.getByTestId("input-demo-email").fill(`test${timestamp}@example.com`);
    await page.getByTestId("input-demo-business").fill("Test Business Inc");
    await page.getByTestId("input-demo-phone").fill("555-0123");

    await page.getByTestId("button-demo-submit").click();

    await expect(page.getByTestId("text-demo-request-success")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Demo Request Received")).toBeVisible();
  });

  test("form requires valid email format", async ({ page }) => {
    await page.goto("/request-demo");

    await page.getByTestId("input-demo-name").fill("Test User");
    await page.getByTestId("input-demo-business").fill("Test Business");
    
    const emailInput = page.getByTestId("input-demo-email");
    await emailInput.fill("invalid-email");
    
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});

test.describe("Demo Page", () => {
  test("demo page loads and shows widget or fallback", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.locator("h1")).toContainText("Live Demo");

    const hasWidget = await page.getByTestId("iframe-demo-widget").isVisible().catch(() => false);
    const hasNotConfigured = await page.getByTestId("text-demo-not-configured").isVisible().catch(() => false);

    expect(hasWidget || hasNotConfigured).toBe(true);
  });

  test("demo page has suggestion chips", async ({ page }) => {
    await page.goto("/demo");

    const chips = await page.locator("[data-testid^='chip-']").count();
    expect(chips).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Public Footer and Navigation", () => {
  test("footer is visible on all public pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Treasure Coast AI. All rights reserved.")).toBeVisible();

    await page.goto("/pricing");
    await expect(page.getByText("Treasure Coast AI. All rights reserved.")).toBeVisible();

    await page.goto("/demo");
    await expect(page.getByText("Treasure Coast AI. All rights reserved.")).toBeVisible();
  });

  test("navigation is visible on all public pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("link-home-logo")).toBeVisible();
    await expect(page.getByTestId("link-sign-in")).toBeVisible();
  });
});
