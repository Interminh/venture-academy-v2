import { createClient } from "@/lib/supabase/server";
import { formatTimeRange, WEEKDAY_LABELS, gradeLabel } from "@/lib/utils/slots";

export default async function ParentSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tutees } = await supabase
    .from("tutees")
    .select("id, first_name, grade")
    .eq("parent_id", user!.id);

  const tuteeById = new Map((tutees ?? []).map((t) => [t.id, t]));
  const tuteeIds = tutees?.map((t) => t.id) ?? [];

  const [{ data: statuses }, { data: subjects }] = await Promise.all([
    tuteeIds.length
      ? supabase
          .from("slot_status")
          .select("slot_id, tutee_id, day, start_time, claimed_subject_id, tutor_id, status")
          .in("tutee_id", tuteeIds)
          .eq("status", "approved")
      : Promise.resolve({ data: [] }),
    supabase.from("subjects").select("id, name"),
  ]);

  const subjectNameById = new Map((subjects ?? []).map((s) => [s.id, s.name]));

  const tutorIds = [...new Set((statuses ?? []).map((s) => s.tutor_id).filter((id): id is string => !!id))];
  const { data: tutors } = tutorIds.length
    ? await supabase.from("profiles").select("id, display_name, email").in("id", tutorIds)
    : { data: [] };
  const tutorById = new Map((tutors ?? []).map((t) => [t.id, t]));

  const sessions = (statuses ?? [])
    .map((s) => ({
      ...s,
      tutee: tuteeById.get(s.tutee_id),
      tutor: s.tutor_id ? tutorById.get(s.tutor_id) : undefined,
      subjectName: s.claimed_subject_id ? subjectNameById.get(s.claimed_subject_id) : undefined,
    }))
    .sort((a, b) => a.day.localeCompare(b.day) || a.start_time.localeCompare(b.start_time));

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Sessions</h1>
      <p className="mb-6 text-body">
        Every confirmed booking across your students, with the tutor&apos;s
        contact info so you can reach out directly.
      </p>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-body">
          No confirmed sessions yet. Once a director approves a claim on one
          of your students, it&apos;ll show up here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
                <th className="p-3">Student</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Time</th>
                <th className="p-3">Tutor</th>
                <th className="p-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.slot_id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-ink">
                    {s.tutee?.first_name}{" "}
                    <span className="font-normal text-body">
                      {s.tutee && `(${gradeLabel(s.tutee.grade)})`}
                    </span>
                  </td>
                  <td className="p-3">{s.subjectName ?? "—"}</td>
                  <td className="p-3 whitespace-nowrap">
                    {WEEKDAY_LABELS[s.day]} {formatTimeRange(s.start_time)}
                  </td>
                  <td className="p-3">{s.tutor?.display_name ?? "—"}</td>
                  <td className="p-3 text-body">{s.tutor?.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
