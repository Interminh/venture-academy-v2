import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-extrabold text-white">
            VA
          </span>
          <span className="font-heading text-lg font-extrabold text-ink">
            Venture Academy Tutors
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Sign up
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
