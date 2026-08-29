import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  admin: [
    { href: "/dashboard/admin", label: "Approvals" },
    { href: "/dashboard/admin/ledger", label: "Ledger" },
    { href: "/dashboard/admin/subjects", label: "Subjects" },
    { href: "/dashboard/admin/tutees", label: "Students" },
    { href: "/dashboard/admin/tutors", label: "Tutors" },
    { href: "/dashboard/admin/users", label: "Users" },
    { href: "/dashboard/admin/stats", label: "Stats" },
  ],
  tutor: [
    { href: "/dashboard/tutor", label: "Browse slots" },
    { href: "/dashboard/tutor/claims", label: "My sessions" },
  ],
  parent: [
    { href: "/dashboard/parent", label: "My students" },
    { href: "/dashboard/parent/sessions", label: "Sessions" },
    { href: "/dashboard/parent/intake", label: "Add a student" },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const nav = NAV_BY_ROLE[profile.role] ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-heading text-base font-extrabold text-ink">
              VAT
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-bg-soft hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={profile.display_name} size="sm" />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-body hover:bg-bg-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
