import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { AuthPageHeader } from "@/components/ui/AuthPageHeader";
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
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <AuthPageHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
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
    </div>
  );
}
