import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

// Server component so signed-in users see a way back in instead of Log in / Sign up.
export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur relative">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/vat-logo.png"
            alt="Venture Academy Tutors"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full"
            priority
          />
          <span className="font-heading text-lg font-extrabold text-ink">
            Venture Academy Tutors
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <ButtonLink href="/dashboard" size="sm">
              Home
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
      <ButtonLink
        href="https://forms.cloud.microsoft/r/kwvwdwK8sB"
        variant="ghost"
        size="sm"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-1/2 right-6 -translate-y-1/2"
      >
        Contact Us
      </ButtonLink>
    </header>
  );
}
