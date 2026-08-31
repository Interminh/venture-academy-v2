import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { testEmail, testName, logCreated } from "../support/testData";
import type { Database } from "@/lib/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function createAccountAndGetToken(): Promise<{ token: string; email: string }> {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  const email = testEmail("notif-token");
  const password = "testpass123";
  await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: testName("NotifToken"), role: "parent" } },
  });
  logCreated("profile", email);
  await supabase.auth.signInWithPassword({ email, password });
  const userId = (await supabase.auth.getUser()).data.user!.id;
  const { data } = await supabase.from("profiles").select("unsubscribe_token").eq("id", userId).single();
  return { token: data!.unsubscribe_token as unknown as string, email };
}

test("valid token unsubscribes, and the same token resubscribes", async ({ page }) => {
  const { token } = await createAccountAndGetToken();

  await page.goto(`/notifications/unsubscribe?token=${token}`);
  await expect(page.locator("text=Unsubscribe from session notifications")).toBeVisible();
  await page.click('button[type="submit"]');
  await expect(page.locator("text=won't get any more session notification emails")).toBeVisible({
    timeout: 10_000,
  });

  await page.goto(`/notifications/unsubscribe?token=${token}`);
  await expect(page.locator("text=you're currently").or(page.locator("text=unsubscribed from session"))).toBeVisible();
  await page.click('button[type="submit"]');
  await expect(page.locator("text=back on the list")).toBeVisible({ timeout: 10_000 });
});

test("missing token shows invalid link, not a crash", async ({ page }) => {
  await page.goto("/notifications/unsubscribe");
  await expect(page.locator("text=This link isn't valid")).toBeVisible();
});

test("malformed/nonexistent token shows invalid link", async ({ page }) => {
  await page.goto("/notifications/unsubscribe?token=not-a-real-uuid-at-all");
  await expect(page.locator("text=This link isn't valid")).toBeVisible();
});

test("well-formed but nonexistent UUID token shows invalid link, not another user's data", async ({ page }) => {
  await page.goto("/notifications/unsubscribe?token=00000000-0000-0000-0000-000000000000");
  await expect(page.locator("text=This link isn't valid")).toBeVisible();
});
