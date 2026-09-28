import Link from "next/link";
import { confirmRecovery } from "@/lib/actions/auth";
import { Card } from "@/components/ui/Card";
import { AuthPageHeader } from "@/components/ui/AuthPageHeader";
import { Button } from "@/components/ui/Button";

// This used to be a route handler that exchanged the recovery code for a
// session on GET, straight off the email link. Corporate link scanners
// (Outlook Safe Links, Defender, etc.) fetch that URL automatically to
// scan it, which burns the single-use code before the person ever clicks
// it themselves, so their real click landed on an already-spent code and
// looked like a broken link.
//
// Rendering a plain page here instead has no side effect, so a scanner's
// GET is harmless. The actual exchange only happens from the form below,
// which requires a real click/submit that scanners don't perform.
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const { code, next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <AuthPageHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Card className="p-8 text-center">
            {code ? (
              <>
                <h1 className="mb-1 font-heading text-xl font-bold text-ink">
                  Continue password reset
                </h1>
                <p className="mb-6 text-sm text-body">
                  Click below to finish resetting your password.
                </p>
                <form action={confirmRecovery}>
                  <input type="hidden" name="code" value={code} />
                  {next ? <input type="hidden" name="next" value={next} /> : null}
                  <Button type="submit" className="w-full">
                    Continue
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-sm text-body">
                This reset link is invalid or was already used.{" "}
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
