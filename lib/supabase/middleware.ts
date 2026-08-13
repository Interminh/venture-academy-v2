import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  tutor: "/dashboard/tutor",
  parent: "/dashboard/parent",
};

// Refreshes the Supabase session cookie on every request and enforces
// role-gating for /dashboard/{admin,tutor,parent}/* route groups. Reads
// the role from `profiles`, not a client-settable value, so gating can't
// be bypassed by tampering with anything the browser controls.
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

  const path = request.nextUrl.pathname;
  const isDashboardRoute = path.startsWith("/dashboard");

  // getUser() hits Supabase's auth endpoint on every request this proxy
  // matches, which is nearly the whole site. A network-level failure
  // (paused project, unreachable host) throws instead of returning an
  // error, and an uncaught throw here would crash the proxy itself,
  // before Next.js ever reaches a page or an error boundary. Failing
  // open and skipping role-gating lets the request through to the actual
  // page, where the same Supabase call throws again in a place
  // app/error.tsx can actually catch and show something useful for.
  let user: { id: string } | null = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch {
    return supabaseResponse;
  }

  // Redirects need to carry forward any session cookies that getUser() just
  // refreshed on supabaseResponse. A bare NextResponse.redirect() would
  // silently drop a just-refreshed token on this request.
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
    try {
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
    } catch {
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}
