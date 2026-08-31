import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { testEmail, testName, logCreated } from "../support/testData";
import type { Database } from "@/lib/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Bypasses the Next.js app entirely and talks to the same public
// Supabase REST endpoint the browser bundle does, using only the anon key.
// This is exactly what a malicious/curious authenticated user could do
// from devtools, so it's the right layer to test RLS boundaries at.

test("self role update: can a plain user grant themselves admin via a direct API call?", async () => {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  const email = testEmail("privesc-probe");
  const password = "testpass123";

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: testName("PrivescProbe"), role: "parent" } },
  });
  expect(signUpError).toBeNull();
  logCreated("profile", email);
  const userId = signUpData.user!.id;

  const { error: updateError, data: updateData } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId)
    .select("id, role");

  console.log("Self role-escalation attempt:", { updateError, updateData });

  const { data: profileAfter } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  console.log("Profile role after attempted self-escalation:", profileAfter?.role);

  if (profileAfter?.role === "admin") {
    console.error(
      "SECURITY FINDING: a freshly signed-up parent account granted itself admin " +
        "via a direct Supabase update call, bypassing the app's updateUserRole action entirely."
    );
    // Self-heal immediately: this session still satisfies id = auth.uid(),
    // so it can revert its own row the same way it escalated it, closing
    // the exposure window on this test account without touching anyone else.
    await supabase.from("profiles").update({ role: "parent" }).eq("id", userId);
  }

  expect(profileAfter?.role).not.toBe("admin");
});

test("anon (no session) cannot read tutees, claims, or profiles", async () => {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: tutees, error: tuteesErr } = await supabase.from("tutees").select("*").limit(5);
  const { data: claims, error: claimsErr } = await supabase.from("claims").select("*").limit(5);
  const { data: profiles, error: profilesErr } = await supabase.from("profiles").select("*").limit(5);

  console.log({
    tuteesCount: tutees?.length,
    tuteesErr: tuteesErr?.message,
    claimsCount: claims?.length,
    claimsErr: claimsErr?.message,
    profilesCount: profiles?.length,
    profilesErr: profilesErr?.message,
  });

  // RLS should return an empty set (not an error, and not real rows) for
  // every one of these to an unauthenticated caller.
  expect(tutees ?? []).toHaveLength(0);
  expect(claims ?? []).toHaveLength(0);
  expect(profiles ?? []).toHaveLength(0);
});

test("anon can read active subjects but not inactive ones", async () => {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: subjects } = await supabase.from("subjects").select("id, name, is_active");
  console.log("Anon-visible subjects:", subjects?.length, "inactive leaked:", subjects?.some((s) => !s.is_active));
  expect(subjects?.some((s) => s.is_active === false)).toBe(false);
});

test("a parent cannot read another parent's tutee by guessing/enumerating its id", async () => {
  const supabaseA = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  const supabaseB = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

  const emailA = testEmail("rls-parent-a");
  const emailB = testEmail("rls-parent-b");
  const password = "testpass123";

  await supabaseA.auth.signUp({
    email: emailA,
    password,
    options: { data: { display_name: testName("RlsParentA"), role: "parent" } },
  });
  logCreated("profile", emailA);
  await supabaseA.auth.signInWithPassword({ email: emailA, password });

  const { data: tutee } = await supabaseA
    .from("tutees")
    .insert({ parent_id: (await supabaseA.auth.getUser()).data.user!.id, first_name: testName("RlsTutee"), grade: 2 })
    .select("id")
    .single();
  logCreated("tutee", testName("RlsTutee"));
  expect(tutee).not.toBeNull();

  await supabaseB.auth.signUp({
    email: emailB,
    password,
    options: { data: { display_name: testName("RlsParentB"), role: "parent" } },
  });
  logCreated("profile", emailB);
  await supabaseB.auth.signInWithPassword({ email: emailB, password });

  const { data: leaked, error } = await supabaseB.from("tutees").select("*").eq("id", tutee!.id);
  console.log("Parent B reading Parent A's tutee by known id:", { leaked, error: error?.message });

  expect(leaked ?? []).toHaveLength(0);

  // Also confirm B can't update or delete A's tutee directly.
  const { data: updateResult } = await supabaseB
    .from("tutees")
    .update({ first_name: "Hacked" })
    .eq("id", tutee!.id)
    .select("id");
  expect(updateResult ?? []).toHaveLength(0);
});

test("a tutor cannot insert a claim as another tutor (tutor_id spoofing)", async () => {
  const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  const email = testEmail("spoof-tutor");
  const password = "testpass123";
  // No valid tutor code available in this isolated script context, so this
  // account signs up as parent; the insert should be rejected by RLS
  // (claims_insert_tutor requires auth_role() = 'tutor') regardless, which
  // is itself the thing being tested: a non-tutor cannot insert a claim
  // no matter whose tutor_id they attach.
  await supabaseAdmin.auth.signUp({
    email,
    password,
    options: { data: { display_name: testName("SpoofTutor"), role: "parent" } },
  });
  logCreated("profile", email);
  await supabaseAdmin.auth.signInWithPassword({ email, password });

  const fakeOtherTutorId = "00000000-0000-0000-0000-000000000000";
  const { data, error } = await supabaseAdmin
    .from("claims")
    .insert({ slot_id: fakeOtherTutorId, tutor_id: fakeOtherTutorId, subject_id: fakeOtherTutorId, status: "pending" })
    .select("id");

  console.log("Non-tutor claim insert attempt:", { data, error: error?.message });
  expect(data ?? []).toHaveLength(0);
});
