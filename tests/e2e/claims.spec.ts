import { test, expect, type Browser } from "@playwright/test";
import { testEmail, testName, logCreated } from "../support/testData";
import { signUp, logIn } from "../support/authHelpers";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../support/testConfig";

async function createTutorCode(browser: Browser, code: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/dashboard/admin/users");
  await page.fill('input[name="code"]', code);
  await page.click('button:has-text("Add code")');
  await expect(page.locator(`text=${code}`)).toBeVisible({ timeout: 10_000 });
  logCreated("tutorCode", code);
  await context.close();
}

async function createTuteeWithSlots(
  page: import("@playwright/test").Page,
  opts: { firstName: string; subjectName?: string; slotCount: number; maxWeeklySessions?: number }
) {
  await page.goto("/dashboard/parent/intake");
  await page.fill("#firstName", opts.firstName);
  await page.selectOption("#grade", "3");
  if (opts.maxWeeklySessions) {
    await page.fill("#maxWeeklySessions", String(opts.maxWeeklySessions));
  }
  // Pick the first available subject chip regardless of name (subject list
  // is seeded and may vary), unless a specific one is requested.
  if (opts.subjectName) {
    await page.click(`label:has-text("${opts.subjectName}")`);
  } else {
    await page.locator("label.cursor-pointer.rounded-full").first().click();
  }
  // Click N distinct slot cells in the availability grid.
  const cells = page.locator('table button[aria-pressed="false"]');
  for (let i = 0; i < opts.slotCount; i++) {
    await cells.nth(i).click();
  }
  await page.click('button:has-text("Add student")');
  await page.waitForURL(/\/dashboard\/parent/, { timeout: 15_000 });
  logCreated("tutee", opts.firstName);
}

test.describe.configure({ mode: "serial" });

test("two tutors claiming the same open slot at once: exactly one succeeds", async ({ browser }) => {
  test.setTimeout(120_000);
  const runTag = Date.now().toString(36);
  const tutorCode = `QA-RACE-${runTag}`;
  await createTutorCode(browser, tutorCode);

  const parentCtx = await browser.newContext();
  const parentPage = await parentCtx.newPage();
  const parentEmail = testEmail("race-parent");
  await signUp(parentPage, { name: testName("RaceParent"), email: parentEmail, password: "testpass123" });
  logCreated("profile", parentEmail);

  const tuteeName = `QARace${runTag}`;
  await createTuteeWithSlots(parentPage, { firstName: tuteeName, slotCount: 1 });

  const tutorACtx = await browser.newContext();
  const tutorAPage = await tutorACtx.newPage();
  const tutorAEmail = testEmail("race-tutor-a");
  await signUp(tutorAPage, {
    name: testName("RaceTutorA"),
    email: tutorAEmail,
    password: "testpass123",
    tutorCode,
  });
  logCreated("profile", tutorAEmail);

  const tutorBCtx = await browser.newContext();
  const tutorBPage = await tutorBCtx.newPage();
  const tutorBEmail = testEmail("race-tutor-b");
  await signUp(tutorBPage, {
    name: testName("RaceTutorB"),
    email: tutorBEmail,
    password: "testpass123",
    tutorCode,
  });
  logCreated("profile", tutorBEmail);

  for (const p of [tutorAPage, tutorBPage]) {
    await p.goto(`/dashboard/tutor?subject=`);
    await p.click(`button:has-text("${tuteeName}")`);
    await p.locator("select").last().selectOption({ index: 1 });
  }

  const [resA, resB] = await Promise.all([
    tutorAPage.click('button:has-text("Claim")').then(() => tutorAPage.waitForTimeout(3000)),
    tutorBPage.click('button:has-text("Claim")').then(() => tutorBPage.waitForTimeout(3000)),
  ]);

  // The winner's ClaimButton gets swept away by the realtime refresh before
  // "Claim submitted" can be observed (the slot re-renders as Pending, with
  // no claim form left at all), so check for the loser's rejection message
  // instead of the winner's transient success text.
  const aRejected = await tutorAPage.locator("text=Someone just claimed this slot").isVisible();
  const bRejected = await tutorBPage.locator("text=Someone just claimed this slot").isVisible();

  console.log({ aRejected, bRejected });

  // Exactly one tutor should be rejected by the race guard; the other's
  // claim should have gone through, never both succeeding (double-booked)
  // or both failing.
  expect([aRejected, bRejected].filter(Boolean).length).toBe(1);

  // Confirm the slot actually ended up Pending (the winner's claim landed),
  // not stuck Open (both silently failed).
  await tutorAPage.reload();
  await tutorAPage.click(`button:has-text("${tuteeName}")`);
  await expect(tutorAPage.locator("text=Pending").first()).toBeVisible({ timeout: 10_000 });

  await parentCtx.close();
  await tutorACtx.close();
  await tutorBCtx.close();
});

test("weekly session cap blocks a second live claim once reached", async ({ browser }) => {
  test.setTimeout(120_000);
  const runTag = Date.now().toString(36);
  const tutorCode = `QA-CAP-${runTag}`;
  await createTutorCode(browser, tutorCode);

  const parentCtx = await browser.newContext();
  const parentPage = await parentCtx.newPage();
  const parentEmail = testEmail("cap-parent");
  await signUp(parentPage, { name: testName("CapParent"), email: parentEmail, password: "testpass123" });
  logCreated("profile", parentEmail);

  const tuteeName = `QACap${runTag}`;
  await createTuteeWithSlots(parentPage, { firstName: tuteeName, slotCount: 2, maxWeeklySessions: 1 });

  const tutorCtx = await browser.newContext();
  const tutorPage = await tutorCtx.newPage();
  const tutorEmail = testEmail("cap-tutor");
  await signUp(tutorPage, {
    name: testName("CapTutor"),
    email: tutorEmail,
    password: "testpass123",
    tutorCode,
  });
  logCreated("profile", tutorEmail);

  await tutorPage.goto("/dashboard/tutor");
  await tutorPage.click(`button:has-text("${tuteeName}")`);

  const claimForms = tutorPage.locator('form:has(button:has-text("Claim"))');
  await claimForms.nth(0).locator("select").selectOption({ index: 1 });
  await claimForms.nth(0).locator('button:has-text("Claim")').click();
  // The realtime refresh sweeps away the transient "Claim submitted" text
  // as soon as the slot re-renders Pending, so confirm the status instead.
  await tutorPage.waitForTimeout(2000);

  await tutorPage.reload();
  await tutorPage.click(`button:has-text("${tuteeName}")`);
  const secondForms = tutorPage.locator('form:has(button:has-text("Claim"))');
  await secondForms.nth(0).locator("select").selectOption({ index: 1 });
  await secondForms.nth(0).locator('button:has-text("Claim")').click();

  await expect(tutorPage.locator("text=already reached their weekly session limit")).toBeVisible({
    timeout: 10_000,
  });

  await parentCtx.close();
  await tutorCtx.close();
});
