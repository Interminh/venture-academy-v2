import { test, expect } from "@playwright/test";
import { testEmail, testName, logCreated } from "../support/testData";
import { ADMIN_EMAIL } from "../support/testConfig";

// All accounts created here use @example.com addresses (IANA-reserved,
// never delivers real mail) so nothing sent by the app during testing
// reaches a real person. Production auto-confirms email on signup
// (migration 0002), so no inbox is needed to log in immediately after.

test.describe("signup", () => {
  test("parent signup with valid data succeeds", async ({ page }) => {
    const email = testEmail("parent-valid");
    await page.goto("/signup");
    await page.fill("#displayName", testName("Parent"));
    await page.fill("#email", email);
    await page.fill("#password", "testpass123");
    await page.check('input[name="notificationsAcknowledged"]');
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Almost done").or(page.locator("text=dashboard"))).toBeVisible({
      timeout: 10_000,
    }).catch(async () => {
      // No email confirmation required in prod, so a successful signup
      // may redirect straight to /dashboard instead of showing a message.
      await expect(page).toHaveURL(/dashboard/);
    });

    logCreated("profile", email);
  });

  test("password shorter than 8 chars is rejected", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#displayName", testName("ShortPw"));
    await page.fill("#email", testEmail("short-pw"));
    await page.fill("#password", "short1");
    await page.check('input[name="notificationsAcknowledged"]');
    // minLength=8 is enforced client-side by the browser too; force past it
    // via direct submission to confirm the server also rejects it.
    await page.evaluate(() => {
      const input = document.getElementById("password") as HTMLInputElement;
      input.removeAttribute("minlength");
    });
    await page.click('button[type="submit"]');

    await expect(page.locator("text=at least 8 characters")).toBeVisible({ timeout: 10_000 });
  });

  test("missing required fields shows an error, not a crash", async ({ page }) => {
    await page.goto("/signup");
    await page.check('input[name="notificationsAcknowledged"]');
    await page.click('button[type="submit"]');
    // Browser-native "required" validation should block submission client-side.
    const displayNameInvalid = await page
      .locator("#displayName")
      .evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(displayNameInvalid).toBe(true);
  });

  test("unacknowledged notifications checkbox blocks submit", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#displayName", testName("NoAck"));
    await page.fill("#email", testEmail("no-ack"));
    await page.fill("#password", "testpass123");
    await page.click('button[type="submit"]');
    const checkboxInvalid = await page
      .locator('input[name="notificationsAcknowledged"]')
      .evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(checkboxInvalid).toBe(true);
  });

  test("invalid tutor code is rejected with a specific message", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("#displayName", testName("BadCode"));
    await page.fill("#email", testEmail("bad-code"));
    await page.fill("#password", "testpass123");
    await page.check("text=I'm signing up as a tutor");
    await page.fill("#tutorCode", "DEFINITELY-NOT-A-REAL-CODE-" + Date.now());
    await page.check('input[name="notificationsAcknowledged"]');
    await page.click('button[type="submit"]');

    await expect(page.locator("text=tutor code isn't valid")).toBeVisible({ timeout: 10_000 });
  });

  test("client-side role tampering: submitting role=admin directly is ignored", async ({ page }) => {
    const email = testEmail("role-tamper");
    await page.goto("/signup");
    await page.fill("#displayName", testName("Tamper"));
    await page.fill("#email", email);
    await page.fill("#password", "testpass123");
    await page.check('input[name="notificationsAcknowledged"]');
    // Inject a role field the real form never sends, to confirm the server
    // action ignores any client-supplied role rather than trusting it.
    await page.evaluate(() => {
      const form = document.querySelector("form")!;
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "role";
      hidden.value = "admin";
      form.appendChild(hidden);
    });
    await page.click('button[type="submit"]');
    logCreated("profile", email);
    // Assertion of actual role happens in admin.spec.ts by checking the
    // users list never shows this account as admin.
  });

  test("duplicate email on signup tells the user, not a fake success", async ({ page }) => {
    const email = testEmail("dup-check");
    await page.goto("/signup");
    await page.fill("#displayName", testName("Dup1"));
    await page.fill("#email", email);
    await page.fill("#password", "testpass123");
    await page.check('input[name="notificationsAcknowledged"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    logCreated("profile", email);

    await page.goto("/signup");
    await page.fill("#displayName", testName("Dup2"));
    await page.fill("#email", email);
    await page.fill("#password", "testpass123");
    await page.check('input[name="notificationsAcknowledged"]');
    await page.click('button[type="submit"]');

    await expect(page.locator("text=already exists")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("login", () => {
  test("wrong password shows generic error (no enumeration)", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "definitely-nobody-" + Date.now() + "@example.com");
    await page.fill("#password", "wrongpassword123");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Incorrect email or password")).toBeVisible({ timeout: 10_000 });
  });

  test("logged-out user hitting /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logged-out user hitting /dashboard/admin is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/admin");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("password reset", () => {
  test("reset request gives identical message for real vs fake email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill('input[name="email"], #email', "nonexistent-" + Date.now() + "@example.com");
    await page.click('button[type="submit"]');
    const fakeMsg = await page.locator("text=If that email has an account").textContent();

    await page.goto("/forgot-password");
    await page.fill('input[name="email"], #email', ADMIN_EMAIL);
    await page.click('button[type="submit"]');
    const realMsg = await page.locator("text=If that email has an account").textContent();

    expect(fakeMsg).toBe(realMsg);
  });
});
