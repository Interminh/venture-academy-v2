import { createClient } from "@/lib/supabase/server";
import { StatusTrack } from "@/components/slots/StatusTrack";
import { ForceCancelButton } from "@/components/admin/ForceCancelButton";
import { DismissLedgerClaimButton } from "@/components/admin/DismissLedgerClaimButton";
import { DismissedPanel } from "@/components/admin/DismissedPanel";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { formatTimeRange, WEEKDAY_LABELS, gradeLabel, claimToDisplayStatus } from "@/lib/utils/slots";
import type { ClaimStatus } from "@/lib/types/database";

interface LedgerClaim {
  id: string;
  status: ClaimStatus;
  profiles: { display_name: string } | null;
  subjects: { name: string } | null;
  availability_slots: {
    day: "mon" | "tue" | "wed" | "thu" | "fri";
    start_time: string;
    tutees: { first_name: string; grade: number } | null;
  } | null;
}

function LedgerTable({ claims, dismissed }: { claims: LedgerClaim[]; dismissed: boolean }) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
          <th className="p-3">Student</th>
          <th className="p-3">Subject</th>
          <th className="p-3">Time</th>
          <th className="p-3">Tutor</th>
          <th className="p-3">Status</th>
          {!dismissed && <th className="p-3" />}
        </tr>
      </thead>
      <tbody>
        {claims.map((c) => {
          const slot = c.availability_slots;
          const tutor = c.profiles;
          const subject = c.subjects;

          return (
            <tr key={c.id} className="border-b border-border last:border-0">
              <td className="p-3">
                {slot?.tutees ? `${slot.tutees.first_name} (${gradeLabel(slot.tutees.grade)})` : "-"}
              </td>
              <td className="p-3">{subject?.name ?? "-"}</td>
              <td className="p-3 whitespace-nowrap">
                {slot ? `${WEEKDAY_LABELS[slot.day]} ${formatTimeRange(slot.start_time)}` : "-"}
              </td>
              <td className="p-3">{tutor?.display_name ?? "-"}</td>
              <td className="p-3">
                <StatusTrack status={claimToDisplayStatus(c.status)} />
              </td>
              {!dismissed && (
                <td className="p-3 text-right">
                  {c.status === "approved" && <ForceCancelButton claimId={c.id} />}
                  {(c.status === "cancelled" || c.status === "rejected") && (
                    <DismissLedgerClaimButton claimId={c.id} />
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function AdminLedgerPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase
    .from("claims")
    .select(
      "id, status, requested_at, admin_dismissed_at, profiles!claims_tutor_id_fkey(display_name), subjects(name), availability_slots(day, start_time, tutees(first_name, grade))"
    )
    .order("requested_at", { ascending: false });

  const visibleClaims = (claims ?? []).filter((c) => !c.admin_dismissed_at) as unknown as LedgerClaim[];
  const dismissedClaims = (claims ?? []).filter((c) => c.admin_dismissed_at) as unknown as LedgerClaim[];

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Claims ledger</h1>
      <p className="mb-6 text-body">Full history of every claim, across every status.</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <LedgerTable claims={visibleClaims} dismissed={false} />
      </div>

      <DismissedPanel count={dismissedClaims.length}>
        <div className="overflow-x-auto">
          <LedgerTable claims={dismissedClaims} dismissed />
        </div>
      </DismissedPanel>
    </div>
  );
}
