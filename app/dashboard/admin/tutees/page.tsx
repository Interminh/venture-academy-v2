import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { DeleteTuteeButton } from "@/components/tutees/DeleteTuteeButton";
import { DismissTuteeButton } from "@/components/admin/DismissTuteeButton";
import { DismissedPanel } from "@/components/admin/DismissedPanel";
import { gradeLabel } from "@/lib/utils/slots";
import type { SlotStatusValue } from "@/lib/types/database";

interface AdminTutee {
  id: string;
  first_name: string;
  grade: number;
  is_active: boolean;
  profiles: { display_name: string; email: string } | null;
  tutee_subjects: { subjects: { name: string } | null }[];
}

function TuteesTable({
  tutees,
  counts,
  dismissed,
}: {
  tutees: AdminTutee[];
  counts: Map<string, Record<SlotStatusValue, number>>;
  dismissed: boolean;
}) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
          <th className="p-3">Student</th>
          <th className="p-3">Parent</th>
          <th className="p-3">Subjects</th>
          <th className="p-3">Slots</th>
          {!dismissed && <th className="p-3" />}
        </tr>
      </thead>
      <tbody>
        {tutees.map((t) => {
          const parent = t.profiles;
          const subjectNames = t.tutee_subjects.map((ts) => ts.subjects?.name).filter(Boolean);
          const c = counts.get(t.id) ?? { open: 0, pending: 0, approved: 0 };

          return (
            <tr key={t.id} className="border-b border-border last:border-0 align-top">
              <td className="p-3 font-medium text-ink">
                {t.first_name} <span className="text-body font-normal">({gradeLabel(t.grade)})</span>
                {!t.is_active && (
                  <Badge tone="neutral" className="ml-2">
                    Deleted
                  </Badge>
                )}
              </td>
              <td className="p-3 text-body">
                {parent?.display_name}
                <br />
                <span className="text-xs text-gray-400">{parent?.email}</span>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {subjectNames.map((name) => (
                    <Badge key={name} tone="neutral">
                      {name}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="p-3">
                <div className="flex gap-1.5">
                  <Badge tone="success">{c.open} open</Badge>
                  <Badge tone="warning">{c.pending} pending</Badge>
                  <Badge tone="info">{c.approved} booked</Badge>
                </div>
              </td>
              {!dismissed && (
                <td className="p-3">
                  {t.is_active ? (
                    <DeleteTuteeButton tuteeId={t.id} tuteeName={t.first_name} />
                  ) : (
                    <DismissTuteeButton tuteeId={t.id} />
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

export default async function AdminTuteesPage() {
  const supabase = await createClient();

  const { data: tutees } = await supabase
    .from("tutees")
    .select(
      "id, first_name, grade, is_active, admin_dismissed_at, profiles(display_name, email), tutee_subjects(subjects(name))"
    )
    .order("created_at", { ascending: false });

  const { data: statuses } = await supabase.from("slot_status").select("tutee_id, status");
  const counts = new Map<string, Record<SlotStatusValue, number>>();
  for (const s of statuses ?? []) {
    const current = counts.get(s.tutee_id) ?? { open: 0, pending: 0, approved: 0 };
    current[s.status as SlotStatusValue] += 1;
    counts.set(s.tutee_id, current);
  }

  const visibleTutees = (tutees ?? []).filter((t) => !t.admin_dismissed_at) as unknown as AdminTutee[];
  const dismissedTutees = (tutees ?? []).filter((t) => t.admin_dismissed_at) as unknown as AdminTutee[];

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">All students</h1>
      <p className="mb-6 text-body">A bird&apos;s-eye view across every family in the program.</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <TuteesTable tutees={visibleTutees} counts={counts} dismissed={false} />
      </div>

      <DismissedPanel count={dismissedTutees.length}>
        <div className="overflow-x-auto">
          <TuteesTable tutees={dismissedTutees} counts={counts} dismissed />
        </div>
      </DismissedPanel>
    </div>
  );
}
