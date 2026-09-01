import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges a password-recovery link's code for a session, then sends the
// user to set a new password. Signup/login never route through here since
// we don't use magic links or OAuth.
// A `next` value like "@evil.com/path" turns into a valid URL when
// concatenated with origin (the "@" makes everything before it userinfo,
// so the browser treats evil.com as the actual host), an open redirect.
// The app only ever sends "/reset-password" here itself, so anything that
// doesn't look like a plain same-origin path gets ignored.
function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("@");
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext && isSafeRedirectPath(requestedNext) ? requestedNext : "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
