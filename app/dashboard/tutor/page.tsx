import { createClient } from "@/lib/supabase/server";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { TutorRosterGrid, type StudentSummary } from "@/components/tutor/TutorRosterGrid";
import { Select } from "@/components/ui/Input";
import { toDisplayStatus } from "@/lib/utils/slots";
import type { SlotStatusValue } from "@/lib/types/database";

export default async function TutorBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; grade?: string }>;
}) {
  const { subject: subjectFilter, grade: gradeFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: allSubjects }, { data: tutees }] = await Promise.all([
    supabase.from("subjects").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("tutees")
      .select("id, first_name, grade, notes, max_weekly_sessions, tutee_subjects(subjects(id, name, is_active))")
      .eq("is_active", true)
      .order("first_name"),
  ]);

  let filteredTutees = tutees ?? [];
  if (gradeFilter) {
    filteredTutees = filteredTutees.filter((t) => t.grade === Number(gradeFilter));
  }
  if (subjectFilter) {
    filteredTutees = filteredTutees.filter((t) =>
      (t.tutee_subjects as unknown as { subjects: { id: string } | null }[]).some(
        (ts) => ts.subjects?.id === subjectFilter
      )
    );
  }

  const tuteeIds = filteredTutees.map((t) => t.id);
  const { data: statuses } = tuteeIds.length
    ? await supabase
        .from("slot_status")
        .select("slot_id, tutee_id, day, start_time, status")
        .in("tutee_id", tuteeIds)
    : { data: [] as { slot_id: string; tutee_id: string; day: string; start_time: string; status: SlotStatusValue }[] };

  const students: StudentSummary[] = filteredTutees.map((t) => ({
    id: t.id,
    firstName: t.first_name,
    grade: t.grade,
    notes: t.notes,
    maxWeeklySessions: t.max_weekly_sessions,
    // A subject an admin has since deactivated stays attached to the
    // tutee (an existing family's needs aren't erased), but is dropped
    // here so it can no longer be picked as a subject for a *new* claim.
    // Otherwise "deactivating" a subject wouldn't actually retire it.
    subjects: (
      t.tutee_subjects as unknown as { subjects: { id: string; name: string; is_active: boolean } | null }[]
    )
      .map((ts) => ts.subjects)
      .filter((s): s is { id: string; name: string; is_active: boolean } => s !== null && s.is_active)
      .map((s) => ({ id: s.id, name: s.name })),
    slots: (statuses ?? [])
      .filter((s) => s.tutee_id === t.id)
      .map((s) => ({
        slotId: s.slot_id,
        day: s.day as StudentSummary["slots"][number]["day"],
        startTime: s.start_time,
        status: toDisplayStatus(s.status),
      })),
  }));

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Browse students</h1>
      <p className="mb-6 text-body">
        Pick a student to see their weekly schedule, then claim an open time
        and choose which subject you&apos;ll help with.
      </p>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <Select name="subject" defaultValue={subjectFilter ?? ""} className="w-auto">
          <option value="">All subjects</option>
          {(allSubjects ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select name="grade" defaultValue={gradeFilter ?? ""} className="w-auto">
          <option value="">All grades</option>
          <option value={0}>Kindergarten</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-body hover:bg-bg-soft"
        >
          Filter
        </button>
      </form>

      <TutorRosterGrid students={students} />
    </div>
  );
}
