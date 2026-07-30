import { createClient } from "@/lib/supabase/server";
import { ClaimApprovalRow } from "@/components/admin/ClaimApprovalRow";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { gradeLabel } from "@/lib/utils/slots";

export default async function AdminApprovalsPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase
    .from("claims")
    .select(
      "id, requested_at, profiles!claims_tutor_id_fkey(display_name), subjects(name), availability_slots(day, start_time, tutees(first_name, grade))"
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Approval queue</h1>
      <p className="mb-6 text-body">Review and approve or reject pending claim requests.</p>

      {(!claims || claims.length === 0) && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-body">
          No pending claims right now.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {(claims ?? []).map((c) => {
          const slot = c.availability_slots as unknown as {
            day: "mon" | "tue" | "wed" | "thu" | "fri";
            start_time: string;
            tutees: { first_name: string; grade: number } | null;
          } | null;
          const tutor = c.profiles as unknown as { display_name: string } | null;
          const subject = c.subjects as unknown as { name: string } | null;

          return (
            <ClaimApprovalRow
              key={c.id}
              claimId={c.id}
              tutorName={tutor?.display_name ?? "Tutor"}
              tuteeLabel={
                slot?.tutees ? `${slot.tutees.first_name} (${gradeLabel(slot.tutees.grade)})` : "Student"
              }
              subjectName={subject?.name ?? "Subject"}
              day={slot?.day ?? "mon"}
              startTime={slot?.start_time ?? "16:00"}
              requestedAt={c.requested_at}
            />
          );
        })}
      </div>
    </div>
  );
}
