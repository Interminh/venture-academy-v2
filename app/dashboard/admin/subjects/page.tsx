import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { SubjectForm } from "@/components/admin/SubjectForm";
import { SubjectRow } from "@/components/admin/SubjectRow";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const { data: subjects } = await supabase.from("subjects").select("id, name, is_active").order("name");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Subjects</h1>
      <p className="mb-6 text-body">
        Manage which subjects parents and tutors can pick from. No code
        changes needed to add or retire one.
      </p>

      <Card className="mb-6 p-5">
        <SubjectForm />
      </Card>

      <Card className="p-5">
        {(subjects ?? []).length === 0 && (
          <p className="py-4 text-center text-sm text-body">No subjects yet.</p>
        )}
        {(subjects ?? []).map((s) => (
          <SubjectRow key={s.id} id={s.id} name={s.name} isActive={s.is_active} />
        ))}
      </Card>
    </div>
  );
}
