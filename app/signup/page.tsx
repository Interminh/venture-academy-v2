import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-heading text-xl font-extrabold text-ink">
          Venture Academy Tutors
        </Link>
        <Card className="p-8">
          <h1 className="mb-1 font-heading text-xl font-bold text-ink">
            Sign up for tutoring
          </h1>
          <p className="mb-6 text-sm text-body">
            For parents/guardians of a K-8 student. Tutor accounts are set
            up by a club director — see the tutors page for how to apply.
          </p>
          <SignupForm />
        </Card>
      </div>
    </main>
  );
}
