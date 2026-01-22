import { test, expect } from "@playwright/test";

test.describe("Smoke Tests - Public Pages", () => {
  test("landing page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");

    await expect(page).toHaveTitle(/Treasure Coast AI/i);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByTestId("nav-logo")).toBeVisible();

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("ResizeObserver")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("pricing page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/pricing");

    await expect(page).toHaveTitle(/Pricing/i);
    await expect(page.locator("h1")).toContainText("Pricing");
    await expect(page.getByText("Starter", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Professional", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Agency", { exact: true }).first()).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes("favicon"));
    expect(criticalErrors).toHaveLength(0);
  });

  test("demo page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/demo");

    await expect(page).toHaveTitle(/Demo/i);
    await expect(page.locator("h1")).toContainText("Live Demo");

    const criticalErrors = errors.filter((e) => !e.includes("favicon"));
    expect(criticalErrors).toHaveLength(0);
  });

  test("request-demo page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/request-demo");

    await expect(page).toHaveTitle(/Treasure Coast AI|Request.*Demo/i);
    await expect(page.locator("h1")).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes("favicon"));
    expect(criticalErrors).toHaveLength(0);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Smoke Tests - Widget", () => {
  const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";

  test("widget page loads with chat interface", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(`/widget/${demoBotKey}`);

    await expect(page.getByTestId("chatbox")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("input-chat-message")).toBeVisible();
    await expect(page.getByTestId("button-send-message")).toBeVisible();

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("ResizeObserver")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("widget rejects invalid bot key", async ({ page }) => {
    await page.goto("/widget/invalid-key-12345");

    const body = await page.locator("body").textContent();
    expect(
      body?.includes("not found") ||
        body?.includes("Invalid") ||
        page.url().includes("error")
    ).toBeTruthy();
  });
});

test.describe("Smoke Tests - API Health", () => {
  test("health endpoint returns 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
  });

  test("public bot endpoint returns error for invalid key", async ({
    request,
  }) => {
    const response = await request.get("/api/public/bots/invalid-key");
    expect([400, 404]).toContain(response.status());
  });

  test("public bot endpoint returns 200 for valid key", async ({ request }) => {
    const demoBotKey = "f79db4c0-52dc-4c43-bd38-3689aa5e7510";
    const response = await request.get(`/api/public/bots/${demoBotKey}`);
    expect(response.status()).toBe(200);
  });
});

test.describe("Smoke Tests - Page Accessibility Basics", () => {
  test("landing page has proper title and no duplicate IDs", async ({
    page,
  }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    const ids = await page.$$eval("[id]", (elements) =>
      elements.map((el) => el.id).filter((id) => id)
    );
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toHaveLength(0);
  });

  test("pricing page has proper structure", async ({ page }) => {
    await page.goto("/pricing");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    await expect(page.locator("main, [role='main']").first()).toBeVisible();
  });

  test("all public pages have navigation", async ({ page }) => {
    const pages = ["/", "/pricing", "/demo", "/request-demo"];

    for (const path of pages) {
      await page.goto(path);
      await expect(page.getByTestId("nav-logo")).toBeVisible();
    }
  });
});
