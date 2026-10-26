import Link from "next/link";
import { confirmRecovery } from "@/lib/actions/auth";
import { Card } from "@/components/ui/Card";
import { AuthPageHeader } from "@/components/ui/AuthPageHeader";
import { Button } from "@/components/ui/Button";

// A plain page, not a GET handler, so link scanners can't spend the one-time recovery code.
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
