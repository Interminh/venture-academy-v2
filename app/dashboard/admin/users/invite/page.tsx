import { Card } from "@/components/ui/Card";
import { InviteForm } from "./InviteForm";

export default function InvitePage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Invite a tutor or admin</h1>
      <p className="mb-6 text-body">
        They&apos;ll get an email to set their own password — no shared login.
      </p>
      <Card className="p-6">
        <InviteForm />
      </Card>
    </div>
  );
}
