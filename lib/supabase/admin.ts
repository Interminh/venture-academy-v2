import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Service-role client: bypasses RLS entirely. Only for server-side code
// that has no logged-in user to act as, e.g. the unsubscribe link in a
// notification email, which has to work for someone who isn't signed in
// at all, authenticated only by possessing the secret token in the URL.
// Never import this into anything that runs with a real user's request,
// use the regular server client (lib/supabase/server.ts) there so RLS
// still applies.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
