import { test, expect } from "@playwright/test";

test.describe("Services Settings UI", () => {
  test.describe("OWNER can CRUD services", () => {
    test("create, edit, and delete a service", async ({ page }) => {
      const serviceName = `Test Service ${Date.now()}`;
      const editedName = `Edited ${serviceName}`;

      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: "Services" })
      ).toBeVisible();

      await page.getByTestId("services-add-button").click();
      await expect(page.getByTestId("services-modal")).toBeVisible();

      await page.getByTestId("services-name-input").fill(serviceName);
      await page.getByTestId("services-price-input").fill("25.00");
      await page
        .getByTestId("services-bookingUrl-input")
        .fill("https://calendly.com/test");
      await page.getByTestId("services-save-button").click();

      await expect(page.getByTestId("text-success")).toContainText(
        "Service created"
      );
      await expect(page.getByTestId("services-modal")).not.toBeVisible();

      const serviceRow = page
        .locator(`[data-testid^="services-row-"]`)
        .filter({ hasText: serviceName });
      await expect(serviceRow).toBeVisible();
      await expect(serviceRow.getByText("$25.00")).toBeVisible();
      await expect(serviceRow.getByText("Active")).toBeVisible();

      const editButton = serviceRow.locator(
        '[data-testid^="services-edit-button-"]'
      );
      await editButton.click();
      await expect(page.getByTestId("services-modal")).toBeVisible();

      await page.getByTestId("services-name-input").fill(editedName);
      await page.getByTestId("services-price-input").fill("35.00");
      await page.getByTestId("services-save-button").click();

      await expect(page.getByTestId("text-success")).toContainText(
        "Service updated"
      );

      const editedRow = page
        .locator(`[data-testid^="services-row-"]`)
        .filter({ hasText: editedName });
      await expect(editedRow).toBeVisible();
      await expect(editedRow.getByText("$35.00")).toBeVisible();

      const deleteButton = editedRow.locator(
        '[data-testid^="services-delete-button-"]'
      );
      await deleteButton.click();
      await expect(page.getByTestId("modal-delete-confirm")).toBeVisible();

      await page.getByTestId("button-confirm-delete").click();

      await expect(page.getByTestId("text-success")).toContainText(
        "Service deleted"
      );
      await expect(editedRow).not.toBeVisible();
    });

    test("shows empty state when no services", async ({ page }) => {
      await page.route("**/api/org/settings/services", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              services: [],
              permissions: {
                canEdit: true,
                allowClientEdits: false,
                role: "AGENCY_OWNER",
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("empty-state")).toBeVisible();
      await expect(page.getByText("Add your first service")).toBeVisible();
      await expect(page.getByTestId("services-add-button-empty")).toBeVisible();
    });

    test("reorder services with up/down buttons", async ({ page }) => {
      const service1 = `First ${Date.now()}`;
      const service2 = `Second ${Date.now() + 1}`;

      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await page.getByTestId("services-add-button").click();
      await page.getByTestId("services-name-input").fill(service1);
      await page.getByTestId("services-save-button").click();
      await expect(page.getByTestId("text-success")).toContainText(
        "Service created"
      );
      await expect(page.getByTestId("services-modal")).not.toBeVisible();

      await expect(page.getByText(service1)).toBeVisible();

      await page.getByTestId("services-add-button").click();
      await page.getByTestId("services-name-input").fill(service2);
      await page.getByTestId("services-save-button").click();
      await expect(page.getByTestId("text-success")).toContainText(
        "Service created"
      );
      await expect(page.getByTestId("services-modal")).not.toBeVisible();

      await expect(page.getByText(service2)).toBeVisible();

      const rows = page.locator('[data-testid^="services-row-"]');
      await expect(rows).toHaveCount(await rows.count());
      const initialCount = await rows.count();
      expect(initialCount).toBeGreaterThanOrEqual(2);

      const firstRow = page
        .locator('[data-testid^="services-row-"]')
        .filter({ hasText: service1 });
      const downButton = firstRow.locator(
        '[data-testid^="services-reorder-down-"]'
      );
      await downButton.click();

      await page.waitForTimeout(500);

      const row1 = page
        .locator('[data-testid^="services-row-"]')
        .filter({ hasText: service1 });
      await row1.locator('[data-testid^="services-delete-button-"]').click();
      await page.getByTestId("button-confirm-delete").click();
      await expect(page.getByText(service1)).not.toBeVisible();

      const row2 = page
        .locator('[data-testid^="services-row-"]')
        .filter({ hasText: service2 });
      await row2.locator('[data-testid^="services-delete-button-"]').click();
      await page.getByTestId("button-confirm-delete").click();
      await expect(page.getByText(service2)).not.toBeVisible();
    });
  });

  test.describe("CLIENT with allowClientEdits=false", () => {
    test("shows locked banner and no edit controls", async ({ page }) => {
      await page.route("**/api/org/settings/services", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              services: [
                {
                  id: 999,
                  name: "Sample Service",
                  priceCents: 5000,
                  bookingUrl: null,
                  paymentUrl: null,
                  displayOrder: 0,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
              permissions: {
                canEdit: false,
                allowClientEdits: false,
                role: "CLIENT",
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("banner-locked")).toBeVisible();
      await expect(page.getByText("Editing is locked")).toBeVisible();

      await expect(page.getByTestId("services-add-button")).not.toBeVisible();
      await expect(
        page.getByTestId("services-edit-button-999")
      ).not.toBeVisible();
      await expect(
        page.getByTestId("services-delete-button-999")
      ).not.toBeVisible();
      await expect(
        page.getByTestId("services-reorder-up-999")
      ).not.toBeVisible();
      await expect(
        page.getByTestId("services-reorder-down-999")
      ).not.toBeVisible();

      await expect(page.getByText("Sample Service")).toBeVisible();
      await expect(page.getByText("$50.00")).toBeVisible();
    });
  });

  test.describe("Form validation", () => {
    test("shows error for empty service name", async ({ page }) => {
      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await page.getByTestId("services-add-button").click();
      await page.getByTestId("services-save-button").click();

      await expect(page.getByTestId("error-service-name")).toContainText(
        "Service name is required"
      );
    });

    test("shows error for invalid price", async ({ page }) => {
      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await page.getByTestId("services-add-button").click();
      await page.getByTestId("services-name-input").fill("Test");
      await page.getByTestId("services-price-input").fill("abc");
      await page.getByTestId("services-save-button").click();

      await expect(page.getByTestId("error-service-price")).toContainText(
        "Enter a valid price"
      );
    });

    test("shows error for invalid booking URL", async ({ page }) => {
      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await page.getByTestId("services-add-button").click();
      await page.getByTestId("services-name-input").fill("Test");
      await page.getByTestId("services-bookingUrl-input").fill("not-a-url");
      await page.getByTestId("services-save-button").click();

      await expect(page.getByTestId("error-booking-url")).toContainText(
        "Enter a valid URL"
      );
    });

    test("handles duplicate service name (409)", async ({ page }) => {
      await page.route("**/api/org/settings/services", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              services: [],
              permissions: {
                canEdit: true,
                allowClientEdits: false,
                role: "AGENCY_OWNER",
              },
            }),
          });
        } else if (route.request().method() === "POST") {
          await route.fulfill({
            status: 409,
            contentType: "application/json",
            body: JSON.stringify({
              ok: false,
              error: "duplicate_service",
              message: 'A service named "Existing" already exists',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/app/settings/services");
      await page.waitForLoadState("networkidle");

      await page.getByTestId("services-add-button-empty").click();
      await page.getByTestId("services-name-input").fill("Existing");
      await page.getByTestId("services-save-button").click();

      await expect(page.getByTestId("error-service-name")).toContainText(
        "already exists"
      );
    });
  });
});
