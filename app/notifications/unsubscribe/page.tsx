import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { UnsubscribeForm } from "@/components/notifications/UnsubscribeForm";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let profile: { display_name: string; notifications_enabled: boolean } | null = null;
  if (token) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("display_name, notifications_enabled")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    profile = data;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-heading text-xl font-extrabold text-ink">
          Venture Academy Tutors
        </Link>
        <Card className="p-8">
          <h1 className="mb-2 font-heading text-xl font-bold text-ink">
            {profile?.notifications_enabled === false
              ? "Session notification emails"
              : "Unsubscribe from session notifications"}
          </h1>
          {token && profile ? (
            <>
              <p className="mb-6 text-sm text-body">
                {profile.notifications_enabled ? (
                  <>
                    {profile.display_name}, this stops emails about
                    sessions being booked or accepted. You&apos;ll still
                    get password reset emails if you ever request one.
                  </>
                ) : (
                  <>
                    {profile.display_name}, you&apos;re currently
                    unsubscribed from session notification emails. Want
                    them back on?
                  </>
                )}
              </p>
              <UnsubscribeForm token={token} enabled={profile.notifications_enabled} />
            </>
          ) : (
            <p className="text-sm text-body">This link isn&apos;t valid.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
