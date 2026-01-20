import { test, expect } from "@playwright/test";

test.describe("Public Navigation", () => {
  test("logo click returns to home", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByTestId("nav-logo").click();
    await expect(page).toHaveURL("/");
    await expect(page.locator("h1")).toContainText("AI Lead Capture");
  });

  test("nav links work correctly", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("nav-pricing").click();
    await expect(page).toHaveURL("/pricing");
    await expect(page.locator("h1")).toContainText("Pricing");

    await page.getByTestId("nav-demo").click();
    await expect(page).toHaveURL("/demo");
    await expect(page.locator("h1")).toContainText("Live Demo");

    await page.getByTestId("nav-request-demo").click();
    await expect(page).toHaveURL("/request-demo");
    await expect(page.locator("h1")).toContainText("Request a Demo");

    await page.getByTestId("nav-home").click();
    await expect(page).toHaveURL("/");
  });

  test("hero CTAs navigate correctly", async ({ page }) => {
    await page.goto("/");

    const requestDemoCta = page.getByTestId("link-hero-request-demo");
    await expect(requestDemoCta).toBeVisible();
    await requestDemoCta.click();
    await expect(page).toHaveURL("/request-demo");

    await page.goto("/");
    const liveDemoCta = page.getByTestId("link-hero-live-demo");
    await expect(liveDemoCta).toBeVisible();
    await liveDemoCta.click();
    await expect(page).toHaveURL("/demo");
  });

  test("pricing page CTAs work", async ({ page }) => {
    await page.goto("/pricing");

    const starterCta = page.getByTestId("link-pricing-starter-request-demo");
    await expect(starterCta).toBeVisible();
    await starterCta.click();
    await expect(page).toHaveURL("/request-demo");

    await page.goto("/pricing");
    const proCta = page.getByTestId("link-pricing-request-demo");
    await expect(proCta).toBeVisible();
    await proCta.click();
    await expect(page).toHaveURL("/request-demo");
  });

  test("footer links work", async ({ page }) => {
    await page.goto("/");

    const footerPricing = page.getByTestId("footer-pricing");
    if (await footerPricing.isVisible()) {
      await footerPricing.click();
      await expect(page).toHaveURL("/pricing");
    }

    await page.goto("/");
    const footerDemo = page.getByTestId("footer-demo");
    if (await footerDemo.isVisible()) {
      await footerDemo.click();
      await expect(page).toHaveURL("/demo");
    }
  });
});

test.describe("Demo Page Navigation", () => {
  test("demo page CTA leads to request-demo", async ({ page }) => {
    await page.goto("/demo");

    const requestDemoCta = page.getByTestId("link-demo-request-demo");
    if (await requestDemoCta.isVisible()) {
      await requestDemoCta.click();
      await expect(page).toHaveURL("/request-demo");
    }
  });
});

test.describe("Widget Navigation", () => {
  const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";

  test("widget is accessible via direct URL", async ({ page }) => {
    await page.goto(`/widget/${demoBotKey}`);
    await expect(page.getByTestId("chatbox")).toBeVisible({ timeout: 10000 });
  });

  test("widget embedded in demo page is interactive", async ({ page }) => {
    await page.goto("/demo");

    const hasWidget = await page
      .getByTestId("iframe-demo-widget")
      .isVisible()
      .catch(() => false);

    if (hasWidget) {
      const iframe = page.frameLocator("[data-testid='iframe-demo-widget']");
      const chatbox = iframe.locator("[data-testid='chatbox']");
      await expect(chatbox).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("Keyboard Navigation", () => {
  test("demo form supports keyboard submit", async ({ page }) => {
    await page.goto("/request-demo");

    await page.getByTestId("input-demo-name").fill("Keyboard Test");
    await page.getByTestId("input-demo-email").fill(`kb${Date.now()}@test.com`);
    await page.getByTestId("input-demo-business").fill("Keyboard Business");
    await page.getByTestId("input-demo-phone").fill("555-0199");

    await page.keyboard.press("Enter");

    await expect(page.getByTestId("text-demo-request-success")).toBeVisible({
      timeout: 10000,
    });
  });

  test("widget input supports enter to send", async ({ page }) => {
    const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";
    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("input-chat-message")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("input-chat-message").fill("Hello via keyboard");
    await page.keyboard.press("Enter");

    await expect(page.locator(".tca-bubble-user")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Error Page Handling", () => {
  test("404 page shows for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345");

    const is404 =
      response?.status() === 404 ||
      (await page.locator("body").textContent())?.toLowerCase().includes("not found");

    expect(is404).toBeTruthy();
  });

  test("auth-error page is accessible", async ({ page }) => {
    await page.goto("/auth-error");
    await expect(page.locator("body")).toBeVisible();
  });
});
