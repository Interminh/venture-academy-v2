import type { Page } from "@playwright/test";

export async function signUp(
  page: Page,
  opts: { name: string; email: string; password: string; tutorCode?: string }
) {
  await page.goto("/signup");
  await page.fill("#displayName", opts.name);
  await page.fill("#email", opts.email);
  await page.fill("#password", opts.password);
  if (opts.tutorCode) {
    await page.check("text=I'm signing up as a tutor");
    await page.fill("#tutorCode", opts.tutorCode);
  }
  await page.check('input[name="notificationsAcknowledged"]');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

export async function logIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}
