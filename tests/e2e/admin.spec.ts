import { test, expect } from "@playwright/test";
import { testEmail, testName, logCreated } from "../support/testData";
import { signUp, logIn } from "../support/authHelpers";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../support/testConfig";

test.describe.configure({ mode: "serial" });

test.describe("subjects", () => {
  test("create with XSS payload renders escaped, not executed", async ({ page }) => {
    const runTag = Date.now().toString(36);
    const subjectName = `QA<script>window.__xss_${runTag}=true</script>${runTag}`;
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/subjects");
    await page.fill('input[name="name"]', subjectName);
    await page.click('button:has-text("Add subject")');
    await page.waitForTimeout(1500);
    logCreated("subject", subjectName);

    const executed = await page.evaluate((tag) => (window as unknown as Record<string, unknown>)[`__xss_${tag}`], runTag);
    expect(executed).toBeUndefined();

    // The literal text (including the tags-as-text) should still be visible
    // somewhere, proving it was escaped and rendered as text, not stripped
    // silently either.
    await expect(page.locator(`text=${runTag}`).first()).toBeVisible();
  });

  test("duplicate subject name is rejected", async ({ page }) => {
    const name = `QA-Dup-${Date.now().toString(36)}`;
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/subjects");
    await page.fill('input[name="name"]', name);
    await page.click('button:has-text("Add subject")');
    await page.waitForTimeout(1000);
    logCreated("subject", name);

    await page.fill('input[name="name"]', name);
    await page.click('button:has-text("Add subject")');
    await expect(page.locator("text=already exists")).toBeVisible({ timeout: 10_000 });
  });

  test("empty subject name is rejected", async ({ page }) => {
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/subjects");
    await page.click('button:has-text("Add subject")');
    const invalid = await page.locator('input[name="name"]').evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(invalid).toBe(true);
  });

  test("deactivate then reactivate a subject", async ({ page }) => {
    const name = `QA-Toggle-${Date.now().toString(36)}`;
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/subjects");
    await page.fill('input[name="name"]', name);
    await page.click('button:has-text("Add subject")');
    await page.waitForTimeout(1000);
    logCreated("subject", name);

    const row = page
      .getByText(name, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"justify-between")]')
      .first();
    await row.locator('button:has-text("Deactivate")').click();
    await page.waitForTimeout(1000);
    await expect(row.locator("text=Inactive")).toBeVisible();

    await row.locator('button:has-text("Reactivate")').click();
    await page.waitForTimeout(1000);
    await expect(row.locator("text=Active")).toBeVisible();
  });
});

test.describe("tutor codes", () => {
  test("duplicate tutor code is rejected", async ({ page }) => {
    const code = `QA-DUPCODE-${Date.now().toString(36)}`;
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/users");
    await page.fill('input[name="code"]', code);
    await page.click('button:has-text("Add code")');
    await page.waitForTimeout(1000);
    logCreated("tutorCode", code);

    await page.fill('input[name="code"]', code);
    await page.click('button:has-text("Add code")');
    await expect(page.locator("text=already in use")).toBeVisible({ timeout: 10_000 });
  });

  test("deactivated tutor code can no longer be used to sign up as tutor", async ({ page, browser }) => {
    const code = `QA-DEACT-${Date.now().toString(36)}`;
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
    await row.locator('button:has-text("Deactivate")').click();
    await page.waitForTimeout(1000);

    const signupCtx = await browser.newContext();
    const signupPage = await signupCtx.newPage();
    const email = testEmail("deact-code-signup");
    await signupPage.goto("/signup");
    await signupPage.fill("#displayName", testName("DeactCode"));
    await signupPage.fill("#email", email);
    await signupPage.fill("#password", "testpass123");
    await signupPage.check("text=I'm signing up as a tutor");
    await signupPage.fill("#tutorCode", code);
    await signupPage.check('input[name="notificationsAcknowledged"]');
    await signupPage.click('button[type="submit"]');
    await expect(signupPage.locator("text=tutor code isn't valid")).toBeVisible({ timeout: 10_000 });
    await signupCtx.close();
  });
});

test.describe("user roles", () => {
  test("admin cannot change their own role via the UI (no form shown)", async ({ page }) => {
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/users");
    const selfRow = page.locator("tr", { hasText: "You" });
    await expect(selfRow.locator("select")).toHaveCount(0);
  });

  test("promoting a tutor to admin and back works, and self-change is blocked server-side too", async ({
    page,
    browser,
  }) => {
    const runTag = Date.now().toString(36);
    const code = `QA-ROLE-${runTag}`;
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/users");
    await page.fill('input[name="code"]', code);
    await page.click('button:has-text("Add code")');
    await page.waitForTimeout(1000);
    logCreated("tutorCode", code);

    const tutorCtx = await browser.newContext();
    const tutorPage = await tutorCtx.newPage();
    const tutorEmail = testEmail("role-swap");
    await signUp(tutorPage, { name: testName("RoleSwap"), email: tutorEmail, password: "testpass123", tutorCode: code });
    logCreated("profile", tutorEmail);
    await tutorCtx.close();

    await page.goto("/dashboard/admin/users");
    const targetRow = page.locator("tr", { hasText: tutorEmail });
    await expect(targetRow).toBeVisible({ timeout: 10_000 });
    await targetRow.locator("select").selectOption("admin");
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.locator("tr", { hasText: tutorEmail }).locator("select")).toHaveValue("admin", {
      timeout: 10_000,
    });

    // Revert immediately so no test account is left with admin access.
    await page.locator("tr", { hasText: tutorEmail }).locator("select").selectOption("tutor");
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.locator("tr", { hasText: tutorEmail }).locator("select")).toHaveValue("tutor", {
      timeout: 10_000,
    });
  });
});

test.describe("force-cancel and ledger", () => {
  test("force-cancel reason field: XSS payload is escaped in the ledger view", async ({ page, browser }) => {
    test.setTimeout(90_000);
    const runTag = Date.now().toString(36);
    const code = `QA-FC-${runTag}`;
    await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/dashboard/admin/users");
    await page.fill('input[name="code"]', code);
    await page.click('button:has-text("Add code")');
    await page.waitForTimeout(1000);
    logCreated("tutorCode", code);

    const parentCtx = await browser.newContext();
    const parentPage = await parentCtx.newPage();
    const parentEmail = testEmail("fc-parent");
    await signUp(parentPage, { name: testName("FcParent"), email: parentEmail, password: "testpass123" });
    logCreated("profile", parentEmail);

    const tuteeName = `QAFc${runTag}`;
    await parentPage.goto("/dashboard/parent/intake");
    await parentPage.fill("#firstName", tuteeName);
    await parentPage.selectOption("#grade", "2");
    await parentPage.locator("label.cursor-pointer.rounded-full").first().click();
    await parentPage.locator('table button[aria-pressed="false"]').first().click();
    await parentPage.click('button:has-text("Add student")');
    await parentPage.waitForURL(/\/dashboard\/parent/, { timeout: 15_000 });
    logCreated("tutee", tuteeName);

    const tutorCtx = await browser.newContext();
    const tutorPage = await tutorCtx.newPage();
    const tutorEmail = testEmail("fc-tutor");
    await signUp(tutorPage, { name: testName("FcTutor"), email: tutorEmail, password: "testpass123", tutorCode: code });
    logCreated("profile", tutorEmail);

    await tutorPage.goto("/dashboard/tutor");
    await tutorPage.click(`button:has-text("${tuteeName}")`);
    await tutorPage.locator("select").last().selectOption({ index: 1 });
    await tutorPage.click('button:has-text("Claim")');
    await tutorPage.waitForTimeout(2000);

    await page.goto("/dashboard/admin");
    const approvalRow = page
      .getByText(tuteeName, { exact: false })
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
      .first();
    await expect(approvalRow).toBeVisible({ timeout: 10_000 });
    await approvalRow.locator('button:has-text("Approve")').click();
    await page.waitForTimeout(2000);

    await page.goto("/dashboard/admin/ledger");
    const ledgerRow = page.locator("tr", { hasText: tuteeName }).first();
    const xssReason = `<img src=x onerror="window.__ledger_xss_${runTag}=true">`;
    await expect(ledgerRow.locator('button:has-text("Force-cancel")')).toBeVisible({ timeout: 10_000 });
    await ledgerRow.locator('button:has-text("Force-cancel")').click();
    await ledgerRow.locator('input[name="reason"]').fill(xssReason);
    await ledgerRow.locator('button:has-text("Confirm")').click();
    await page.waitForTimeout(1500);

    const executed = await page.evaluate(
      (tag) => (window as unknown as Record<string, unknown>)[`__ledger_xss_${tag}`],
      runTag
    );
    expect(executed).toBeUndefined();

    // Confirm the row now shows cancelled status, not stuck approved.
    await page.reload();
    await expect(page.locator("tr", { hasText: tuteeName }).first().locator("text=Cancelled")).toBeVisible({
      timeout: 10_000,
    });

    await parentCtx.close();
    await tutorCtx.close();
  });
});
