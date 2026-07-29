import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-heading text-xl font-extrabold text-ink">
          Venture Academy Tutors
        </Link>
        <Card className="p-8">
          <h1 className="mb-1 font-heading text-xl font-bold text-ink">Log in</h1>
          <p className="mb-6 text-sm text-body">
            Tutors and parents both log in here.
          </p>
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
