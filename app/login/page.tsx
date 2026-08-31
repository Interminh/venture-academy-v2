import { Card } from "@/components/ui/Card";
import { AuthPageHeader } from "@/components/ui/AuthPageHeader";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-soft">
      <AuthPageHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Card className="p-8">
            <h1 className="mb-1 font-heading text-xl font-bold text-ink">Log in</h1>
            <p className="mb-6 text-sm text-body">
              Tutors and parents both log in here.
            </p>
            <LoginForm />
          </Card>
        </div>
      </main>
    </div>
  );
}
