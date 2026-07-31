import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { SlotAgenda, type AgendaItem } from "@/components/slots/SlotAgenda";
import { CancelButton } from "@/components/slots/CancelButton";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { HoursLogForm } from "@/components/tutor/HoursLogForm";
import { HoursLogRow } from "@/components/tutor/HoursLogRow";
import { gradeLabel, claimToDisplayStatus } from "@/lib/utils/slots";

export default async function MyClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: claims }, { data: contacts }, { data: hoursLog }] = await Promise.all([
    supabase
      .from("claims")
      .select(
        "id, status, requested_at, subjects(name), availability_slots(id, tutee_id, day, start_time, tutees(first_name, grade))"
      )
      .eq("tutor_id", user!.id)
      .order("requested_at", { ascending: false }),
    // The view itself only returns rows for tutees this tutor has an
    // approved claim against, not just this filter.
    supabase.from("tutor_visible_contacts").select("tutee_id, parent_email").eq("tutor_id", user!.id),
    supabase
      .from("tutor_hours")
      .select("id, session_date, hours, student_label, description")
      .eq("tutor_id", user!.id)
      .order("session_date", { ascending: false }),
  ]);

  const emailByTutee = new Map((contacts ?? []).map((c) => [c.tutee_id, c.parent_email]));

  const items: AgendaItem[] = (claims ?? []).map((c) => {
    const slot = c.availability_slots as unknown as {
      id: string;
      tutee_id: string;
      day: AgendaItem["day"];
      start_time: string;
      tutees: { first_name: string; grade: number } | null;
    } | null;
    const subject = c.subjects as unknown as { name: string } | null;

    const status = claimToDisplayStatus(c.status);
    const email = slot ? emailByTutee.get(slot.tutee_id) : undefined;

    const tuteeLabel = slot?.tutees
      ? [`${slot.tutees.first_name} · ${gradeLabel(slot.tutees.grade)}`, email]
          .filter(Boolean)
          .join(" · ")
      : undefined;

    return {
      id: c.id,
      day: slot?.day ?? "mon",
      startTime: slot?.start_time ?? "16:00",
      subjectName: subject?.name ?? "Subject",
      tuteeLabel,
      status,
      actions: status === "booked" ? <CancelButton claimId={c.id} /> : undefined,
    };
  });

  const totalHours = (hoursLog ?? []).reduce((sum, h) => sum + h.hours, 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <RealtimeRefresh table="claims" />
        <h1 className="mb-1 font-heading text-2xl font-bold text-ink">My sessions</h1>
        <p className="mb-6 text-body">
          Once a director approves a claim, the family&apos;s email shows up
          here so you can reach out directly.
        </p>
        <SlotAgenda items={items} emptyMessage="You haven't claimed any slots yet." />
      </div>

      <div>
        <h2 className="mb-1 font-heading text-lg font-bold text-ink">Log your hours</h2>
        <p className="mb-4 text-body">
          Keep a running record of time tutored — {totalHours} hour{totalHours === 1 ? "" : "s"} logged so far.
        </p>
        <Card className="mb-4 p-4">
          <HoursLogForm />
        </Card>
        {(hoursLog ?? []).length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
                  <th className="p-3">Date</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Description</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {(hoursLog ?? []).map((h) => (
                  <HoursLogRow
                    key={h.id}
                    id={h.id}
                    sessionDate={h.session_date}
                    hours={h.hours}
                    studentLabel={h.student_label}
                    description={h.description}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
