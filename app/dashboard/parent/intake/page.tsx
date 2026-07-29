import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { IntakeForm } from "@/components/forms/IntakeForm";

export default async function IntakePage() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Add a student</h1>
      <p className="mb-6 text-body">
        Tell us about your student — this is what tutors will see when
        browsing open slots.
      </p>
      <Card className="p-6">
        <IntakeForm subjects={subjects ?? []} />
      </Card>
    </div>
  );
}
