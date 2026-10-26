import Image from "next/image";
import Link from "next/link";

// Logo bar shared by auth pages, linking back to the homepage.
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
