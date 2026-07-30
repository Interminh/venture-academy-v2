import { createClient } from "@/lib/supabase/server";
import { StatusTrack } from "@/components/slots/StatusTrack";
import { ForceCancelButton } from "@/components/admin/ForceCancelButton";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { formatTimeRange, WEEKDAY_LABELS, gradeLabel, claimToDisplayStatus } from "@/lib/utils/slots";

export default async function AdminLedgerPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase
    .from("claims")
    .select(
      "id, status, requested_at, profiles!claims_tutor_id_fkey(display_name), availability_slots(day, start_time, subjects(name), tutees(first_name, grade))"
    )
    .order("requested_at", { ascending: false });

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Claims ledger</h1>
      <p className="mb-6 text-body">Full history of every claim, across every status.</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
              <th className="p-3">Student</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Time</th>
              <th className="p-3">Tutor</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(claims ?? []).map((c) => {
              const slot = c.availability_slots as unknown as {
                day: "mon" | "tue" | "wed" | "thu" | "fri";
                start_time: string;
                subjects: { name: string } | null;
                tutees: { first_name: string; grade: number } | null;
              } | null;
              const tutor = c.profiles as unknown as { display_name: string } | null;

              return (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    {slot?.tutees ? `${slot.tutees.first_name} (${gradeLabel(slot.tutees.grade)})` : "—"}
                  </td>
                  <td className="p-3">{slot?.subjects?.name ?? "—"}</td>
                  <td className="p-3 whitespace-nowrap">
                    {slot ? `${WEEKDAY_LABELS[slot.day]} ${formatTimeRange(slot.start_time)}` : "—"}
                  </td>
                  <td className="p-3">{tutor?.display_name ?? "—"}</td>
                  <td className="p-3">
                    <StatusTrack status={claimToDisplayStatus(c.status)} />
                  </td>
                  <td className="p-3 text-right">
                    {c.status === "approved" && <ForceCancelButton claimId={c.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
