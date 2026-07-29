import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  tutor: "/dashboard/tutor",
  parent: "/dashboard/parent",
};

// Refreshes the Supabase session cookie on every request and enforces
// role-gating for /dashboard/{admin,tutor,parent}/* route groups. Reads the
// role from `profiles` (not a client-settable value) so gating can't be
// bypassed by tampering with anything the browser controls.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboardRoute = path.startsWith("/dashboard");

  // Redirects need to carry forward any session cookies that getUser() just
  // refreshed on supabaseResponse — building a bare NextResponse.redirect()
  // instead would silently drop a just-refreshed token on this request.
  function redirect(pathname: string, extraParams?: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      url.searchParams.set(key, value);
    }
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  }

  if (isDashboardRoute && !user) {
    return redirect("/login", { next: path });
  }

  if (isDashboardRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const roleSection = path.split("/")[2]; // "admin" | "tutor" | "parent" | undefined

    if (role && roleSection && roleSection !== role && ["admin", "tutor", "parent"].includes(roleSection)) {
      return redirect(role in ROLE_HOME ? ROLE_HOME[role] : "/login");
    }
  }

  return supabaseResponse;
}
