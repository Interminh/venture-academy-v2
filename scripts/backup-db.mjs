import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(new URL("../.env.test", import.meta.url));
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

// Snapshots every row via the REST API using the service-role key. Bypasses
// RLS like a real pg_dump would, but needs no database password. Covers
// every table this app reads or writes; add a name here if a migration
// adds a new one.
const TABLES = [
  "subjects",
  "tutor_signup_codes",
  "profiles",
  "tutees",
  "tutee_subjects",
  "availability_slots",
  "claims",
  "tutor_hours",
];

async function main() {
  const snapshot = { takenAt: new Date().toISOString(), tables: {} };

  for (const table of TABLES) {
    const { data, error } = await admin.from(table).select("*");
    if (error) {
      console.error(`Failed to read ${table}:`, error.message);
      process.exit(1);
    }
    snapshot.tables[table] = data;
    console.log(`${table}: ${data.length} row(s)`);
  }

  const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error("Failed to list auth users:", listErr.message);
    process.exit(1);
  }
  snapshot.authUsers = usersPage.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    email_confirmed_at: u.email_confirmed_at,
    user_metadata: u.user_metadata,
  }));
  console.log(`auth.users: ${snapshot.authUsers.length} row(s)`);

  const dir = fileURLToPath(new URL("../backups/", import.meta.url));
  fs.mkdirSync(dir, { recursive: true });
  const filename = `backup-${snapshot.takenAt.replace(/[:.]/g, "-")}.json`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));

  console.log(`\nBackup written to ${filepath}`);
}

main();
