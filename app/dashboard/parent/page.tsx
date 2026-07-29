import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SlotAgenda, type AgendaItem } from "@/components/slots/SlotAgenda";
import { gradeLabel, toDisplayStatus } from "@/lib/utils/slots";
import type { SlotStatusValue } from "@/lib/types/database";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tutees } = await supabase
    .from("tutees")
    .select("id, first_name, grade")
    .eq("parent_id", user!.id)
    .order("created_at", { ascending: true });

  if (!tutees || tutees.length === 0) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-ink">My students</h1>
        <p className="mt-2 text-body">You haven&apos;t added a student yet.</p>
        <ButtonLink href="/dashboard/parent/intake" className="mt-6">
          Add your first student
        </ButtonLink>
      </div>
    );
  }

  const tuteeIds = tutees.map((t) => t.id);

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, tutee_id, day, start_time, subjects(name)")
    .in("tutee_id", tuteeIds);

  const { data: statuses } = await supabase
    .from("slot_status")
    .select("slot_id, status")
    .in("tutee_id", tuteeIds);

  const statusBySlot = new Map(
    (statuses ?? []).map((s) => [s.slot_id, s.status as SlotStatusValue])
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">My students</h1>
        <ButtonLink href="/dashboard/parent/intake" size="sm">
          Add a student
        </ButtonLink>
      </div>

      {tutees.map((tutee) => {
        const items: AgendaItem[] = (slots ?? [])
          .filter((s) => s.tutee_id === tutee.id)
          .map((s) => ({
            id: s.id,
            day: s.day,
            startTime: s.start_time,
            subjectName: (s.subjects as unknown as { name: string } | null)?.name ?? "Subject",
            status: toDisplayStatus(statusBySlot.get(s.id) ?? "open"),
          }));

        return (
          <Card key={tutee.id} className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">{tutee.first_name}</h2>
                <p className="text-sm text-body">{gradeLabel(tutee.grade)}</p>
              </div>
              <Link
                href={`/dashboard/parent/tutees/${tutee.id}/edit`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Edit
              </Link>
            </div>
            <SlotAgenda items={items} emptyMessage="No availability added yet." />
          </Card>
        );
      })}
    </div>
  );
}
