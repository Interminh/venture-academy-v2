import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(new URL("../../.env.test", import.meta.url));
} catch {
  // .env.test not present, fall back to whatever's already in the environment.
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(DRY_RUN ? "DRY RUN, no changes will be made\n" : "LIVE RUN, deleting test data\n");

  // 1. Tutees named with the QA test prefix. Deleting cascades to
  // tutee_subjects, availability_slots, and (via slot) claims, all pure
  // test data, no real history worth preserving here.
  const { data: tutees } = await admin.from("tutees").select("id, first_name").ilike("first_name", "QA%");
  console.log(`Tutees to remove: ${tutees?.length ?? 0}`);
  if (tutees?.length) console.log(tutees.map((t) => t.first_name).join(", "));
  if (!DRY_RUN && tutees?.length) {
    const { error } = await admin.from("tutees").delete().in("id", tutees.map((t) => t.id));
    if (error) console.error("tutees delete error:", error.message);
  }

  // 2. Subjects created during testing.
  const { data: subjects } = await admin.from("subjects").select("id, name").ilike("name", "QA%");
  console.log(`\nSubjects to remove: ${subjects?.length ?? 0}`);
  if (subjects?.length) console.log(subjects.map((s) => s.name).join(", "));
  if (!DRY_RUN && subjects?.length) {
    const { error } = await admin.from("subjects").delete().in("id", subjects.map((s) => s.id));
    if (error) console.error("subjects delete error:", error.message);
  }

  // 3. Tutor signup codes created during testing.
  const { data: codes } = await admin.from("tutor_signup_codes").select("id, code").ilike("code", "QA-%");
  console.log(`\nTutor codes to remove: ${codes?.length ?? 0}`);
  if (codes?.length) console.log(codes.map((c) => c.code).join(", "));
  if (!DRY_RUN && codes?.length) {
    const { error } = await admin.from("tutor_signup_codes").delete().in("id", codes.map((c) => c.id));
    if (error) console.error("tutor_signup_codes delete error:", error.message);
  }

  // 4. Auth users created during testing (@example.com addresses only,
  // never touches a real account). Deleting the auth user cascades to
  // profiles via its FK, and to tutor_hours/claims as tutor_id if any
  // remain (none should, since step 1 already removed claim-bearing rows).
  const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("listUsers error:", listErr.message);
  } else {
    const testUsers = usersPage.users.filter((u) => (u.email ?? "").includes("@example.com"));
    console.log(`\nAuth accounts to remove: ${testUsers.length}`);
    if (!DRY_RUN) {
      for (const u of testUsers) {
        const { error } = await admin.auth.admin.deleteUser(u.id);
        if (error) console.error(`deleteUser(${u.email}) error:`, error.message);
      }
    }
  }

  console.log(DRY_RUN ? "\nDry run complete." : "\nCleanup complete.");
}

main();
