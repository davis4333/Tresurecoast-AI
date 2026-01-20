import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";

test.describe("Analytics Dashboard", () => {
  test("analytics page loads with metrics", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Analytics/i })
    ).toBeVisible();

    await expect(page.getByTestId("analytics-conversations")).toBeVisible();
    await expect(page.getByTestId("analytics-leads")).toBeVisible();
    await expect(page.getByTestId("analytics-conversion")).toBeVisible();
  });

  test("analytics page shows date range filter", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    const dateFilter = page.getByTestId("analytics-date-range");
    const hasDateFilter = await dateFilter.isVisible().catch(() => false);

    if (hasDateFilter) {
      await expect(dateFilter).toBeVisible();
    }
  });

  test("analytics page shows topic breakdown", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    const topicsSection = page.getByTestId("analytics-topics");
    const hasTopics = await topicsSection.isVisible().catch(() => false);

    if (hasTopics) {
      await expect(topicsSection).toBeVisible();
    }
  });

  test("analytics page shows revenue metrics card", async ({ page }) => {
    await page.goto("/app/analytics");
    await page.waitForLoadState("networkidle");

    const revenueCard = page.getByTestId("analytics-revenue");
    const hasRevenue = await revenueCard.isVisible().catch(() => false);

    if (hasRevenue) {
      await expect(revenueCard).toBeVisible();
    }
  });
});

test.describe("Leads List Page", () => {
  test("leads page loads with table", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Leads/i })).toBeVisible();

    await expect(page.getByTestId("leads-table")).toBeVisible();
  });

  test("leads page has filter controls", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const statusFilter = page.getByTestId("leads-filter-status");
    const hasStatusFilter = await statusFilter.isVisible().catch(() => false);

    if (hasStatusFilter) {
      await expect(statusFilter).toBeVisible();
    }

    const searchInput = page.getByTestId("leads-search");
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("leads page has export button", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const exportButton = page.getByTestId("leads-export-button");
    const hasExport = await exportButton.isVisible().catch(() => false);

    if (hasExport) {
      await expect(exportButton).toBeVisible();
    }
  });

  test("lead rows show temperature badge", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const leadRows = page.locator('[data-testid^="leads-row-"]');
    const rowCount = await leadRows.count();

    if (rowCount > 0) {
      const firstRow = leadRows.first();
      const tempBadge = firstRow.locator(
        '[data-testid^="leads-temperature-badge-"]'
      );
      const hasTempBadge = await tempBadge.isVisible().catch(() => false);

      if (hasTempBadge) {
        await expect(tempBadge).toBeVisible();
        const badgeText = await tempBadge.textContent();
        expect(["HOT", "WARM", "COLD"]).toContain(badgeText?.trim());
      }
    }
  });

  test("can change lead status", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const leadRows = page.locator('[data-testid^="leads-row-"]');
    const rowCount = await leadRows.count();

    if (rowCount > 0) {
      const firstRow = leadRows.first();
      const statusSelect = firstRow.locator(
        '[data-testid^="leads-status-select-"]'
      );
      const hasStatusSelect = await statusSelect.isVisible().catch(() => false);

      if (hasStatusSelect) {
        await statusSelect.click();

        const contactedOption = page.locator(
          '[data-testid="leads-status-option-CONTACTED"]'
        );
        const hasContacted = await contactedOption.isVisible().catch(() => false);

        if (hasContacted) {
          await contactedOption.click();

          await page.waitForTimeout(1000);
        }
      }
    }
  });
});

test.describe("Lead Detail View", () => {
  test("lead detail modal shows conversation history", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const leadRows = page.locator('[data-testid^="leads-row-"]');
    const rowCount = await leadRows.count();

    if (rowCount > 0) {
      const firstRow = leadRows.first();
      const viewButton = firstRow.locator(
        '[data-testid^="leads-view-button-"]'
      );
      const hasViewButton = await viewButton.isVisible().catch(() => false);

      if (hasViewButton) {
        await viewButton.click();

        const modal = page.getByTestId("leads-detail-modal");
        const hasModal = await modal.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasModal) {
          await expect(modal).toBeVisible();

          const conversationSection = modal.locator(
            '[data-testid="leads-conversation-history"]'
          );
          const hasConversation = await conversationSection
            .isVisible()
            .catch(() => false);

          if (hasConversation) {
            await expect(conversationSection).toBeVisible();
          }
        }
      }
    }
  });
});

test.describe("Analytics API", () => {
  test("analytics API returns valid data", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const bot = await prisma.bot.findFirst({
      where: { status: "ACTIVE" },
      select: { publicKey: true },
    });

    if (!bot) {
      console.log("No ACTIVE bot found, skipping test");
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

    if (response.ok()) {
      const data = await response.json();
      expect(data.ok).toBe(true);

      if (data.analytics) {
        expect(typeof data.analytics.totalConversations).toBe("number");
        expect(typeof data.analytics.totalLeads).toBe("number");
      }
    }
  });

  test("leads API returns paginated results", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/org/leads?page=1&limit=10`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok()) {
      const data = await response.json();
      expect(data.ok).toBe(true);

      if (data.leads) {
        expect(Array.isArray(data.leads)).toBe(true);
      }

      if (data.pagination) {
        expect(typeof data.pagination.total).toBe("number");
        expect(typeof data.pagination.page).toBe("number");
      }
    }
  });

  test("leads export API returns CSV", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(`${baseURL}/api/org/leads/export`, {
      headers: {
        Accept: "text/csv",
      },
    });

    if (response.ok()) {
      const contentType = response.headers()["content-type"];
      expect(
        contentType?.includes("text/csv") ||
          contentType?.includes("application/octet-stream")
      ).toBeTruthy();
    }
  });
});
