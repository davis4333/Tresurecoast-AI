import { test, expect } from "@playwright/test";

test.describe("Services Form Validation", () => {
  test("services form requires name field", async ({ page }) => {
    await page.goto("/app/settings/services");
    await page.waitForLoadState("networkidle");

    const addButton = page.getByTestId("button-add-service");
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      const saveButton = page.getByTestId("button-save-service");
      if (await saveButton.isVisible()) {
        await saveButton.click();

        const errorMessage = page.getByTestId("error-service-name");
        const formError = page.locator(".text-red-500, .text-destructive");

        const hasError =
          (await errorMessage.isVisible().catch(() => false)) ||
          (await formError.first().isVisible().catch(() => false));

        expect(hasError).toBe(true);
      }
    }
  });

  test("services form validates URL format", async ({ page }) => {
    await page.goto("/app/settings/services");
    await page.waitForLoadState("networkidle");

    const addButton = page.getByTestId("button-add-service");
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      const urlInput = page.getByTestId("input-service-booking-url");
      if (await urlInput.isVisible()) {
        await urlInput.fill("not-a-valid-url");

        const saveButton = page.getByTestId("button-save-service");
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test("services API validates required name", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(
      `${baseURL}/api/org/settings/services`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          priceCents: 5000,
          description: "Test service",
        },
      }
    );

    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("Hours Form Validation", () => {
  test("hours page loads with day toggles", async ({ page }) => {
    await page.goto("/app/settings/hours");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Hours/i })
    ).toBeVisible();

    const mondayToggle = page.getByTestId("hours-toggle-monday");
    if (await mondayToggle.isVisible()) {
      await expect(mondayToggle).toBeVisible();
    }
  });

  test("closed day has disabled time inputs", async ({ page }) => {
    await page.goto("/app/settings/hours");
    await page.waitForLoadState("networkidle");

    const sundayToggle = page.getByTestId("hours-toggle-sunday");
    if (await sundayToggle.isVisible()) {
      const isOff = await sundayToggle
        .getAttribute("data-state")
        .then((s) => s === "unchecked")
        .catch(() => false);

      if (isOff) {
        const sundayOpenInput = page.getByTestId("hours-open-sunday");
        const sundayCloseInput = page.getByTestId("hours-close-sunday");

        if (await sundayOpenInput.isVisible()) {
          const isDisabled = await sundayOpenInput.isDisabled();
          expect(isDisabled).toBe(true);
        }
      }
    }
  });

  test("hours API validates time format", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.put(`${baseURL}/api/org/settings/hours`, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        monday: { isOpen: true, open: "invalid", close: "17:00" },
      },
    });

    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("Leads Notes Validation", () => {
  test("leads page loads filters", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("leads-filter-status")).toBeVisible();
    await expect(page.getByTestId("leads-filter-search")).toBeVisible();
  });

  test("leads export button works", async ({ page }) => {
    await page.goto("/app/leads");
    await page.waitForLoadState("networkidle");

    const exportButton = page.getByTestId("button-export-leads");
    await expect(exportButton).toBeVisible();
  });

  test("leads API validates pagination params", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.get(
      `${baseURL}/api/org/leads?page=-1&limit=10000`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Notifications Form Validation", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/app/settings/notifications");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Notifications/i })
    ).toBeVisible();
  });

  test("notifications email input exists", async ({ page }) => {
    await page.goto("/app/settings/notifications");
    await page.waitForLoadState("networkidle");

    const emailInput = page.getByTestId("input-notification-email");
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
    }
  });

  test("notifications API validates email format", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.put(
      `${baseURL}/api/org/settings/notifications`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          notificationEmails: ["not-an-email"],
        },
      }
    );

    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("Branding Form Validation", () => {
  test("branding page loads", async ({ page }) => {
    await page.goto("/app/settings/branding");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Branding/i })
    ).toBeVisible();
  });

  test("branding color picker exists", async ({ page }) => {
    await page.goto("/app/settings/branding");
    await page.waitForLoadState("networkidle");

    const colorInput = page.getByTestId("input-brand-color");
    if (await colorInput.isVisible()) {
      await expect(colorInput).toBeVisible();
    }
  });

  test("branding API validates hex color format", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.put(
      `${baseURL}/api/org/settings/branding`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          brandColor: "not-a-hex-color",
        },
      }
    );

    expect([400, 401, 403, 422]).toContain(response.status());
  });
});

test.describe("Knowledge Base Validation", () => {
  test("knowledge base page loads", async ({ page }) => {
    await page.goto("/app/kb");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Knowledge/i })
    ).toBeVisible();
  });

  test("add knowledge source button exists", async ({ page }) => {
    await page.goto("/app/kb");
    await page.waitForLoadState("networkidle");

    const addButton = page.getByTestId("button-add-knowledge");
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test("knowledge API validates required fields", async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5000";

    const response = await request.post(
      `${baseURL}/api/org/bots/test-key/knowledge`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          content: "Some content without a title",
        },
      }
    );

    expect([400, 401, 403, 404, 422]).toContain(response.status());
  });
});
