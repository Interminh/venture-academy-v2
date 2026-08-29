import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { StatusTrack } from "@/components/slots/StatusTrack";
import { ExpandableRow } from "@/components/admin/ExpandableRow";
import { gradeLabel, claimToDisplayStatus, formatTimeRange, WEEKDAY_LABELS } from "@/lib/utils/slots";
import type { ClaimStatus, Weekday } from "@/lib/types/database";

interface AdminTutor {
  id: string;
  display_name: string;
  email: string;
}

interface TutorClaimDetail {
  day: Weekday;
  start_time: string;
  status: ClaimStatus;
  studentLabel: string;
}

function TutorClaimsDetail({ claims }: { claims: TutorClaimDetail[] }) {
  if (claims.length === 0) {
    return <p className="text-sm text-body">No claims yet.</p>;
  }

  const sorted = [...claims].sort(
    (a, b) => a.day.localeCompare(b.day) || a.start_time.localeCompare(b.start_time)
  );

  return (
    <table className="w-full max-w-lg text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-gray-400">
          <th className="pb-1.5 pr-4">Day</th>
          <th className="pb-1.5 pr-4">Time</th>
          <th className="pb-1.5 pr-4">Status</th>
          <th className="pb-1.5">Student</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c, i) => (
          <tr key={i}>
            <td className="py-1 pr-4">{WEEKDAY_LABELS[c.day]}</td>
            <td className="py-1 pr-4 whitespace-nowrap">{formatTimeRange(c.start_time)}</td>
            <td className="py-1 pr-4">
              <StatusTrack status={claimToDisplayStatus(c.status)} />
            </td>
            <td className="py-1">{c.studentLabel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminTutorsPage() {
  const supabase = await createClient();

  const [{ data: tutors }, { data: claims }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("role", "tutor")
      .order("display_name"),
    supabase
      .from("claims")
      .select(
        "tutor_id, status, availability_slots(day, start_time, tutees(first_name, grade))"
      ),
  ]);

  const counts = new Map<string, { pending: number; approved: number }>();
  const claimsByTutor = new Map<string, TutorClaimDetail[]>();

  for (const c of claims ?? []) {
    const slot = c.availability_slots as unknown as {
      day: Weekday;
      start_time: string;
      tutees: { first_name: string; grade: number } | null;
    } | null;

    if (c.status === "pending" || c.status === "approved") {
      const current = counts.get(c.tutor_id) ?? { pending: 0, approved: 0 };
      current[c.status] += 1;
      counts.set(c.tutor_id, current);
    }

    const list = claimsByTutor.get(c.tutor_id) ?? [];
    list.push({
      day: slot?.day ?? "mon",
      start_time: slot?.start_time ?? "16:00",
      status: c.status,
      studentLabel: slot?.tutees ? `${slot.tutees.first_name} (${gradeLabel(slot.tutees.grade)})` : "-",
    });
    claimsByTutor.set(c.tutor_id, list);
  }

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">All tutors</h1>
      <p className="mb-6 text-body">Every registered tutor and their claim activity.</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
              <th className="p-3" />
              <th className="p-3">Tutor</th>
              <th className="p-3">Email</th>
              <th className="p-3">Claims</th>
            </tr>
          </thead>
          <tbody>
            {((tutors ?? []) as AdminTutor[]).map((t) => {
              const c = counts.get(t.id) ?? { pending: 0, approved: 0 };
              return (
                <ExpandableRow
                  key={t.id}
                  colSpan={4}
                  rowClassName="border-b border-border last:border-0 align-top"
                  detail={<TutorClaimsDetail claims={claimsByTutor.get(t.id) ?? []} />}
                >
                  <td className="p-3 font-medium text-ink">{t.display_name}</td>
                  <td className="p-3 text-body">{t.email}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <Badge tone="warning">{c.pending} pending</Badge>
                      <Badge tone="info">{c.approved} booked</Badge>
                    </div>
                  </td>
                </ExpandableRow>
              );
            })}
          </tbody>
        </table>
        {(tutors ?? []).length === 0 && (
          <p className="p-8 text-center text-sm text-body">No tutors have signed up yet.</p>
        )}
      </div>
    </div>
  );
}
