import { test, expect } from "@playwright/test";

test.describe("Hours Settings UI", () => {
  test.describe("OWNER can manage hours", () => {
    test("loads hours page and shows 7 days", async ({ page }) => {
      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: "Business Hours" })
      ).toBeVisible();
      await expect(page.getByTestId("hours-grid")).toBeVisible();

      for (let i = 0; i < 7; i++) {
        await expect(page.getByTestId(`hours-day-${i}`)).toBeVisible();
      }

      await expect(page.getByTestId("text-day-name-0")).toContainText("Sunday");
      await expect(page.getByTestId("text-day-name-1")).toContainText("Monday");
      await expect(page.getByTestId("text-day-name-6")).toContainText(
        "Saturday"
      );
    });

    test("toggle day closed/open and save", async ({ page }) => {
      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("hours-grid")).toBeVisible();

      const mondayToggle = page.getByTestId("hours-closed-toggle-1");
      const mondayStatus = page.getByTestId("text-status-1");

      const initialOpen = (await mondayStatus.textContent())?.includes("Open");

      await mondayToggle.click();
      await page.waitForTimeout(300);

      if (initialOpen) {
        await expect(mondayStatus).toContainText("Closed");
        await expect(page.getByTestId("hours-open-input-1")).not.toBeVisible();
      } else {
        await expect(mondayStatus).toContainText("Open");
        await expect(page.getByTestId("hours-open-input-1")).toBeVisible();
        await expect(page.getByTestId("hours-close-input-1")).toBeVisible();
      }

      await expect(page.getByTestId("hours-revert-button")).toBeVisible();

      await page.getByTestId("hours-save-button").click();

      await expect(page.getByTestId("text-success")).toContainText(
        "Hours saved"
      );

      await page.reload();
      await page.waitForLoadState("networkidle");

      if (initialOpen) {
        await expect(page.getByTestId("text-status-1")).toContainText("Closed");
      } else {
        await expect(page.getByTestId("text-status-1")).toContainText("Open");
      }

      await mondayToggle.click();
      await page.getByTestId("hours-save-button").click();
      await expect(page.getByTestId("text-success")).toContainText(
        "Hours saved"
      );
    });

    test("edit open/close times and save", async ({ page }) => {
      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      const tuesdayToggle = page.getByTestId("hours-closed-toggle-2");
      const tuesdayStatus = page.getByTestId("text-status-2");

      if ((await tuesdayStatus.textContent())?.includes("Closed")) {
        await tuesdayToggle.click();
        await page.waitForTimeout(300);
      }

      await expect(page.getByTestId("hours-open-input-2")).toBeVisible();
      await expect(page.getByTestId("hours-close-input-2")).toBeVisible();

      await page.getByTestId("hours-open-input-2").fill("10:00");
      await page.getByTestId("hours-close-input-2").fill("18:00");

      await page.getByTestId("hours-save-button").click();
      await expect(page.getByTestId("text-success")).toContainText(
        "Hours saved"
      );

      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("hours-open-input-2")).toHaveValue("10:00");
      await expect(page.getByTestId("hours-close-input-2")).toHaveValue(
        "18:00"
      );
    });

    test("revert changes button restores original state", async ({ page }) => {
      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      const wednesdayToggle = page.getByTestId("hours-closed-toggle-3");
      const wednesdayStatus = page.getByTestId("text-status-3");

      const initialStatus = await wednesdayStatus.textContent();

      await wednesdayToggle.click();
      await page.waitForTimeout(300);

      await expect(page.getByTestId("hours-revert-button")).toBeVisible();
      await page.getByTestId("hours-revert-button").click();

      await expect(wednesdayStatus).toContainText(initialStatus || "");
      await expect(page.getByTestId("hours-revert-button")).not.toBeVisible();
    });
  });

  test.describe("Validation", () => {
    test("blocks save when close time is before open time", async ({
      page,
    }) => {
      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      const thursdayToggle = page.getByTestId("hours-closed-toggle-4");
      const thursdayStatus = page.getByTestId("text-status-4");

      if ((await thursdayStatus.textContent())?.includes("Closed")) {
        await thursdayToggle.click();
        await page.waitForTimeout(300);
      }

      await page.getByTestId("hours-open-input-4").fill("17:00");
      await page.getByTestId("hours-close-input-4").fill("09:00");

      await expect(page.getByTestId("error-row-4")).toBeVisible();
      await expect(page.getByTestId("error-row-4")).toContainText(
        "Close time must be after open time"
      );

      const saveButton = page.getByTestId("hours-save-button");
      await expect(saveButton).toBeDisabled();
    });

    test("blocks save when times are equal", async ({ page }) => {
      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      const fridayToggle = page.getByTestId("hours-closed-toggle-5");
      const fridayStatus = page.getByTestId("text-status-5");

      if ((await fridayStatus.textContent())?.includes("Closed")) {
        await fridayToggle.click();
        await page.waitForTimeout(300);
      }

      await page.getByTestId("hours-open-input-5").fill("12:00");
      await page.getByTestId("hours-close-input-5").fill("12:00");

      await expect(page.getByTestId("error-row-5")).toBeVisible();
      await expect(page.getByTestId("error-row-5")).toContainText(
        "Close time must be after open time"
      );
    });
  });

  test.describe("CLIENT with allowClientEdits=false", () => {
    test("shows locked banner and inputs disabled", async ({ page }) => {
      await page.route("**/api/org/settings/hours", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ok: true,
              hours: [
                {
                  dayOfWeek: 0,
                  isClosed: true,
                  openTime: null,
                  closeTime: null,
                },
                {
                  dayOfWeek: 1,
                  isClosed: false,
                  openTime: "09:00",
                  closeTime: "17:00",
                },
                {
                  dayOfWeek: 2,
                  isClosed: false,
                  openTime: "09:00",
                  closeTime: "17:00",
                },
                {
                  dayOfWeek: 3,
                  isClosed: false,
                  openTime: "09:00",
                  closeTime: "17:00",
                },
                {
                  dayOfWeek: 4,
                  isClosed: false,
                  openTime: "09:00",
                  closeTime: "17:00",
                },
                {
                  dayOfWeek: 5,
                  isClosed: false,
                  openTime: "09:00",
                  closeTime: "17:00",
                },
                {
                  dayOfWeek: 6,
                  isClosed: true,
                  openTime: null,
                  closeTime: null,
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

      await page.goto("/app/settings/hours");
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("banner-locked")).toBeVisible();
      await expect(
        page.getByText("Editing is disabled by your agency")
      ).toBeVisible();

      await expect(page.getByTestId("hours-closed-toggle-1")).toBeDisabled();
      await expect(page.getByTestId("hours-open-input-1")).toBeDisabled();
      await expect(page.getByTestId("hours-close-input-1")).toBeDisabled();

      await expect(page.getByTestId("hours-save-button")).not.toBeVisible();
    });
  });

  test.describe("Settings hub navigation", () => {
    test("settings hub has link to hours page", async ({ page }) => {
      await page.goto("/app/settings");
      await page.waitForLoadState("networkidle");

      await expect(page.getByTestId("settings-hours-link")).toBeVisible();
      await expect(page.getByText("Business Hours")).toBeVisible();

      await page.getByTestId("settings-hours-link").click();
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: "Business Hours" })
      ).toBeVisible();
    });
  });
});
