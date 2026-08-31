import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { AuthPageHeader } from "@/components/ui/AuthPageHeader";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <AuthPageHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Card className="p-8">
            <h1 className="mb-1 font-heading text-xl font-bold text-ink">Set a new password</h1>
            {user ? (
              <>
                <p className="mb-6 text-sm text-body">Choose a new password for your account.</p>
                <ResetPasswordForm />
              </>
            ) : (
              <p className="text-sm text-body">
                This reset link has expired or was already used.{" "}
                <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                  Request a new one
                </Link>
                .
              </p>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
