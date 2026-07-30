const PARENT_STEPS = [
  { title: "Tell us what you need", body: "Sign up and add your student's grade, subjects, and weekly availability." },
  { title: "A tutor claims a slot", body: "Volunteer tutors browse open times and request the ones that work for them." },
  { title: "You're matched", body: "Once a director approves the match, you'll hear from your tutor directly." },
];

const TUTOR_STEPS = [
  { title: "Sign up with a tutor code", body: "Get the code from a club director, then create your own account — no shared password." },
  { title: "Browse open slots", body: "Filter by grade and subject, then request the times you can commit to." },
  { title: "Get approved and tutor", body: "A director reviews your request; once approved, you're matched with the family." },
];

function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="flex flex-col gap-6">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-booked-bg font-heading text-sm font-bold text-primary">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold text-ink">{step.title}</p>
            <p className="mt-0.5 text-sm text-body">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16" id="how-it-works">
      <h2 className="text-center font-heading text-2xl font-bold text-ink sm:text-3xl">
        How it works
      </h2>
      <div className="mt-10 grid gap-12 sm:grid-cols-2">
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-primary">
            For families
          </p>
          <StepList steps={PARENT_STEPS} />
        </div>
        <div>
          <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-primary">
            For tutors
          </p>
          <StepList steps={TUTOR_STEPS} />
        </div>
      </div>
    </section>
  );
}
