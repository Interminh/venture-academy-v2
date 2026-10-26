import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  tutor: "/dashboard/tutor",
  parent: "/dashboard/parent",
};

// Refreshes the session cookie and gates dashboard routes by the role in `profiles`.
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

  // Fails open if Supabase is unreachable so app/error.tsx can handle it instead of the proxy crashing.
  let user: { id: string } | null = null;
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  } catch {
    return supabaseResponse;
  }

  // Redirects must carry the refreshed session cookies from supabaseResponse.
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
