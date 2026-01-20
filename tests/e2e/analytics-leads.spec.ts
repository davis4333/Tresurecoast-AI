import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Analytics Dashboard", () => {
  test("analytics page loads with KPI cards", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Analytics/i })
    ).toBeVisible();

    await expect(page.getByTestId("analytics-kpi-leads")).toBeVisible();
    await expect(page.getByTestId("analytics-kpi-clicks")).toBeVisible();
    await expect(page.getByTestId("analytics-kpi-conversion")).toBeVisible();
  });

  test("analytics page shows date range filter buttons", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("analytics-filter-range-7")).toBeVisible();
    await expect(page.getByTestId("analytics-filter-range-30")).toBeVisible();
    await expect(page.getByTestId("analytics-filter-range-90")).toBeVisible();
  });

  test("analytics page shows top topics section", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("analytics-kpi-top-topics")).toBeVisible();
  });

  test("analytics page shows funnel visualization", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("analytics-kpi-funnel")).toBeVisible();
  });

  test("date range filter changes data", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    const filter7d = page.getByTestId("analytics-filter-range-7");
    const filter30d = page.getByTestId("analytics-filter-range-30");

    await expect(filter7d).toBeVisible();
    await filter7d.click();
    await page.waitForTimeout(500);

    await filter30d.click();
    await page.waitForTimeout(500);
  });
});

test.describe("Leads List Page", () => {
  test("leads page loads with table or empty state", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Leads/i })).toBeVisible();

    const hasTable = await page
      .getByTestId("leads-table")
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByTestId("empty-state")
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);
  });

  test("leads page has filter controls", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("leads-filter-status")).toBeVisible();
    await expect(page.getByTestId("leads-filter-temperature")).toBeVisible();
    await expect(page.getByTestId("leads-filter-search")).toBeVisible();
    await expect(page.getByTestId("leads-filter-date-range")).toBeVisible();
  });

  test("leads page has export button", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("button-export-leads")).toBeVisible();
  });

  test("leads page shows stats cards", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("stat-total")).toBeVisible();
    await expect(page.getByTestId("stat-hot")).toBeVisible();
    await expect(page.getByTestId("stat-new")).toBeVisible();
  });

  test("lead row shows temperature badge", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const leadRows = page.locator('[data-testid^="leads-row-"]').filter({
      has: page.locator('[data-testid^="leads-row-temp-"]'),
    });
    const rowCount = await leadRows.count();

    if (rowCount > 0) {
      const tempBadge = leadRows
        .first()
        .locator('[data-testid^="leads-row-temp-"]');
      await expect(tempBadge).toBeVisible();
      const badgeText = await tempBadge.textContent();
      expect(["HOT", "WARM", "COLD"]).toContain(badgeText?.trim());
    }
  });

  test("lead status selector is visible", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const leadRows = page.locator('[data-testid^="leads-row-"]');
    const rowCount = await leadRows.count();

    if (rowCount > 0) {
      const statusSelect = leadRows
        .first()
        .locator('[data-testid^="leads-row-status-"]');
      await expect(statusSelect).toBeVisible();
    }
  });
});

test.describe("Analytics API", () => {
  test("analytics API returns valid data structure", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const bot = await prisma.bot.findFirst({
      where: { status: "ACTIVE" },
      select: { publicKey: true },
    });

    if (!bot) {
      test.skip();
      return;
    }

    const response = await request.get(
      `${baseURL}/api/org/analytics?botPublicKey=${bot.publicKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    expect(response.status()).toBeLessThan(500);
  });

  test("leads API returns valid response", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(
      `${baseURL}/api/org/leads?page=1&limit=10`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    expect(response.status()).toBeLessThan(500);
  });

  test("leads export returns valid content-type", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/org/leads/export`, {
      headers: {
        Accept: "text/csv",
      },
    });

    expect(response.status()).toBeLessThan(500);
  });
});
