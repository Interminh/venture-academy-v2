import Image from "next/image";
import Link from "next/link";

// Top-left logo bar shared by every standalone auth-adjacent page (login,
// signup, password reset/forgot, notification settings), so there's
// always a one-click way back to the marketing homepage instead of a
// dead end.
export function AuthPageHeader() {
  return (
    <header className="border-b border-border bg-white px-6 py-4">
      <Link href="/" className="flex w-fit items-center gap-2.5">
        <Image
          src="/vat-logo.png"
          alt="Venture Academy Tutors"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full"
          priority
        />
        <span className="font-heading text-base font-extrabold text-ink">
          Venture Academy Tutors
        </span>
      </Link>
    </header>
  );
}
