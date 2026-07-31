import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-heading text-xl font-extrabold text-ink">
          Venture Academy Tutors
        </Link>
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
  );
}
