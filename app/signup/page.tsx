import { Card } from "@/components/ui/Card";
import { AuthPageHeader } from "@/components/ui/AuthPageHeader";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <AuthPageHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Card className="p-8">
            <h1 className="mb-1 font-heading text-xl font-bold text-ink">
              Create an account
            </h1>
            <p className="mb-6 text-sm text-body">
              For parents signing their student up for tutoring, and for
              Interlake tutors (you&apos;ll need a code from a club director).
            </p>
            <SignupForm />
          </Card>
        </div>
      </main>
    </div>
  );
}
