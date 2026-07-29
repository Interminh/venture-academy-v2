import { ButtonLink } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        Ready to get started?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-body">
        It takes a few minutes to sign up, and it's completely free.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/signup">Sign up your student</ButtonLink>
        <ButtonLink href="/login" variant="ghost">
          Already have an account? Log in
        </ButtonLink>
      </div>
    </section>
  );
}
