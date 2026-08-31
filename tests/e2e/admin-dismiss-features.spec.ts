import { test, expect } from "@playwright/test";
import { testEmail, testName, logCreated } from "../support/testData";
import { signUp, logIn } from "../support/authHelpers";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../support/testConfig";

test.describe.configure({ mode: "serial" });

test("delete account moves it into the Dismissed panel, and the account keeps working", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);
  const targetCtx = await browser.newContext();
  const targetPage = await targetCtx.newPage();
  const targetEmail = testEmail("dismiss-acct");
  await signUp(targetPage, { name: testName("DismissAcct"), email: targetEmail, password: "testpass123" });
  logCreated("profile", targetEmail);
  await targetCtx.close();

  await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/users");

  const row = page.locator("tr", { hasText: targetEmail });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.locator('button:has-text("Delete")').click();
  await row.locator('button:has-text("Confirm delete")').click();
  await page.waitForTimeout(1500);
  await page.reload();

  // Gone from the main table...
  await expect(page.locator("table").first().locator("tr", { hasText: targetEmail })).toHaveCount(0);

  // ...but present in the Dismissed panel.
  const dismissedPanel = page.locator("details", { hasText: "Dismissed" }).last();
  await dismissedPanel.locator("summary").click();
  await expect(dismissedPanel.locator("tr", { hasText: targetEmail })).toBeVisible();

  // The account itself still works: can still log in and reach its dashboard.
  const verifyCtx = await browser.newContext();
  const verifyPage = await verifyCtx.newPage();
  await logIn(verifyPage, targetEmail, "testpass123");
  await expect(verifyPage).toHaveURL(/\/dashboard\/parent/);
  await verifyCtx.close();
});

test("admin cannot delete their own account (no button shown)", async ({ page }) => {
  await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/users");
  const selfRow = page.locator("tr", { hasText: "You" });
  await expect(selfRow.locator('button:has-text("Delete")')).toHaveCount(0);
});

test("dismiss tutor code: blocked while active, works once deactivated", async ({ page }) => {
  test.setTimeout(60_000);
  const code = `QA-DISMISS-${Date.now().toString(36)}`;
  await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/users");
  await page.fill('input[name="code"]', code);
  await page.click('button:has-text("Add code")');
  await page.waitForTimeout(1000);
  logCreated("tutorCode", code);

  const row = page
    .getByText(code, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"justify-between")]')
    .first();

  // While active, there's no Dismiss button at all — only Deactivate.
  await expect(row.locator('button:has-text("Dismiss")')).toHaveCount(0);

  await row.locator('button:has-text("Deactivate")').click();
  await page.waitForTimeout(1000);

  const inactiveRow = page
    .getByText(code, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"justify-between")]')
    .first();
  await expect(inactiveRow.locator('button:has-text("Dismiss")')).toBeVisible();
  await inactiveRow.locator('button:has-text("Dismiss")').click();
  await page.waitForTimeout(1000);
  await page.reload();

  // The code should now live only inside the collapsed Dismissed panel,
  // not visible anywhere on the page until that panel is opened.
  await expect(page.getByText(code, { exact: true })).not.toBeVisible();

  const dismissedPanel = page.locator("details", { hasText: "Dismissed" }).first();
  await dismissedPanel.locator("summary").click();
  await expect(dismissedPanel.getByText(code, { exact: true })).toBeVisible();
});
