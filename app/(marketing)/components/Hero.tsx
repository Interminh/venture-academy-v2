import { ButtonLink } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
        Interlake High School · Bellevue School District
      </p>
      <h1 className="mx-auto max-w-3xl font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Free tutoring for students, from students.
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base text-body sm:text-lg">
        Venture Academy Tutors pairs K-8 students with volunteer Interlake
        tutors for one-on-one help, at no cost to families.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/signup" size="md">
          Sign up
        </ButtonLink>
        <ButtonLink href="/login" variant="secondary" size="md">
          Log in
        </ButtonLink>
      </div>
    </section>
  );
}
