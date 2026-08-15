import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { SlotAgenda, type AgendaItem } from "@/components/slots/SlotAgenda";
import { DeleteTuteeButton } from "@/components/tutees/DeleteTuteeButton";
import { gradeLabel, toDisplayStatus } from "@/lib/utils/slots";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tutees } = await supabase
    .from("tutees")
    .select("id, first_name, grade, notes, max_weekly_sessions")
    .eq("parent_id", user!.id)
    .eq("is_active", true)
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

  const [{ data: statuses }, { data: subjects }] = await Promise.all([
    supabase
      .from("slot_status")
      .select("slot_id, tutee_id, day, start_time, claimed_subject_id, status")
      .in("tutee_id", tuteeIds),
    supabase.from("subjects").select("id, name"),
  ]);

  const subjectNameById = new Map((subjects ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">My students</h1>
        <ButtonLink href="/dashboard/parent/intake" size="sm">
          Add a student
        </ButtonLink>
      </div>

      {tutees.map((tutee) => {
        const tuteeStatuses = (statuses ?? []).filter((s) => s.tutee_id === tutee.id);
        const bookedCount = tuteeStatuses.filter((s) => s.status === "approved").length;
        const isFullyBooked =
          tutee.max_weekly_sessions !== null && bookedCount >= tutee.max_weekly_sessions;

        const items: AgendaItem[] = tuteeStatuses.map((s) => ({
          id: s.slot_id,
          day: s.day,
          startTime: s.start_time,
          subjectName: s.claimed_subject_id
            ? subjectNameById.get(s.claimed_subject_id)
            : undefined,
          status: toDisplayStatus(s.status),
        }));

        return (
          <Card key={tutee.id} className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-ink">{tutee.first_name}</h2>
                  {isFullyBooked && <Badge tone="info">Fully booked</Badge>}
                </div>
                <p className="text-sm text-body">
                  {gradeLabel(tutee.grade)}
                  {tutee.max_weekly_sessions !== null &&
                    ` · ${bookedCount}/${tutee.max_weekly_sessions} sessions booked`}
                </p>
                {tutee.notes && <p className="mt-1 text-xs text-gray-400">{tutee.notes}</p>}
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/dashboard/parent/tutees/${tutee.id}/edit`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Edit
                </Link>
                <DeleteTuteeButton tuteeId={tutee.id} tuteeName={tutee.first_name} />
              </div>
            </div>
            <SlotAgenda items={items} emptyMessage="No availability added yet." />
          </Card>
        );
      })}
    </div>
  );
}
