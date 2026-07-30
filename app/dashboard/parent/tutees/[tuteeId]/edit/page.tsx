import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { IntakeForm } from "@/components/forms/IntakeForm";
import type { SlotKey } from "@/components/forms/AvailabilityPicker";

export default async function EditTuteePage({
  params,
}: {
  params: Promise<{ tuteeId: string }>;
}) {
  const { tuteeId } = await params;
  const supabase = await createClient();

  const [{ data: subjects }, { data: tutee }, { data: tuteeSubjects }, { data: slots }] =
    await Promise.all([
      supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
      supabase.from("tutees").select("id, first_name, grade").eq("id", tuteeId).single(),
      supabase.from("tutee_subjects").select("subject_id").eq("tutee_id", tuteeId),
      supabase.from("availability_slots").select("day, start_time").eq("tutee_id", tuteeId),
    ]);

  if (!tutee) notFound();

  const slotKeys: SlotKey[] = (slots ?? []).map(
    (slot) => `${slot.day}|${slot.start_time}` as SlotKey
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Edit {tutee.first_name}</h1>
      <p className="mb-6 text-body">
        Update subjects or availability. Slots already claimed by a tutor
        stay in place until that claim is cancelled.
      </p>
      <Card className="p-6">
        <IntakeForm
          subjects={subjects ?? []}
          existing={{
            id: tutee.id,
            first_name: tutee.first_name,
            grade: tutee.grade,
            subjectIds: (tuteeSubjects ?? []).map((s) => s.subject_id),
            slots: slotKeys,
          }}
        />
      </Card>
    </div>
  );
}
