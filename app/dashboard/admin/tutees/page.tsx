import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { StatusTrack } from "@/components/slots/StatusTrack";
import { DeleteTuteeButton } from "@/components/tutees/DeleteTuteeButton";
import { DismissTuteeButton } from "@/components/admin/DismissTuteeButton";
import { DismissedPanel } from "@/components/admin/DismissedPanel";
import { ExpandableRow } from "@/components/admin/ExpandableRow";
import { gradeLabel, toDisplayStatus, formatTimeRange, WEEKDAY_LABELS } from "@/lib/utils/slots";
import type { SlotStatusValue, Weekday } from "@/lib/types/database";

interface AdminTutee {
  id: string;
  first_name: string;
  grade: number;
  is_active: boolean;
  profiles: { display_name: string; email: string } | null;
  tutee_subjects: { subjects: { name: string } | null }[];
}

interface TuteeSlotDetail {
  day: Weekday;
  start_time: string;
  status: SlotStatusValue;
  tutorName: string | null;
}

function TuteeSlotsDetail({ slots }: { slots: TuteeSlotDetail[] }) {
  if (slots.length === 0) {
    return <p className="text-sm text-body">No availability added yet.</p>;
  }

  const sorted = [...slots].sort(
    (a, b) => a.day.localeCompare(b.day) || a.start_time.localeCompare(b.start_time)
  );

  return (
    <table className="w-full max-w-lg text-left text-sm">
      <thead>
        <tr className="text-xs uppercase tracking-wide text-gray-400">
          <th className="pb-1.5 pr-4">Day</th>
          <th className="pb-1.5 pr-4">Time</th>
          <th className="pb-1.5 pr-4">Status</th>
          <th className="pb-1.5">Tutor</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((s, i) => (
          <tr key={i}>
            <td className="py-1 pr-4">{WEEKDAY_LABELS[s.day]}</td>
            <td className="py-1 pr-4 whitespace-nowrap">{formatTimeRange(s.start_time)}</td>
            <td className="py-1 pr-4">
              <StatusTrack status={toDisplayStatus(s.status)} />
            </td>
            <td className="py-1">{s.tutorName ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TuteesTable({
  tutees,
  counts,
  slotsByTutee,
  dismissed,
}: {
  tutees: AdminTutee[];
  counts: Map<string, Record<SlotStatusValue, number>>;
  slotsByTutee: Map<string, TuteeSlotDetail[]>;
  dismissed: boolean;
}) {
  const colSpan = dismissed ? 5 : 6;

  return (
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead>
        <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
          <th className="p-3" />
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
            <ExpandableRow
              key={t.id}
              colSpan={colSpan}
              rowClassName="border-b border-border last:border-0 align-top"
              detail={<TuteeSlotsDetail slots={slotsByTutee.get(t.id) ?? []} />}
            >
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
            </ExpandableRow>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function AdminTuteesPage() {
  const supabase = await createClient();

  const [{ data: tutees }, { data: statuses }] = await Promise.all([
    supabase
      .from("tutees")
      .select(
        "id, first_name, grade, is_active, admin_dismissed_at, profiles(display_name, email), tutee_subjects(subjects(name))"
      )
      .order("created_at", { ascending: false }),
    supabase.from("slot_status").select("tutee_id, day, start_time, status, tutor_id"),
  ]);

  const counts = new Map<string, Record<SlotStatusValue, number>>();
  for (const s of statuses ?? []) {
    const current = counts.get(s.tutee_id) ?? { open: 0, pending: 0, approved: 0 };
    current[s.status as SlotStatusValue] += 1;
    counts.set(s.tutee_id, current);
  }

  const tutorIds = [...new Set((statuses ?? []).map((s) => s.tutor_id).filter((id): id is string => !!id))];
  const { data: tutors } = tutorIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", tutorIds)
    : { data: [] };
  const tutorNameById = new Map((tutors ?? []).map((t) => [t.id, t.display_name]));

  const slotsByTutee = new Map<string, TuteeSlotDetail[]>();
  for (const s of statuses ?? []) {
    const list = slotsByTutee.get(s.tutee_id) ?? [];
    list.push({
      day: s.day as Weekday,
      start_time: s.start_time,
      status: s.status as SlotStatusValue,
      tutorName: s.tutor_id ? tutorNameById.get(s.tutor_id) ?? null : null,
    });
    slotsByTutee.set(s.tutee_id, list);
  }

  const visibleTutees = (tutees ?? []).filter((t) => !t.admin_dismissed_at) as unknown as AdminTutee[];
  const dismissedTutees = (tutees ?? []).filter((t) => t.admin_dismissed_at) as unknown as AdminTutee[];

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">All students</h1>
      <p className="mb-6 text-body">A bird&apos;s-eye view across every family in the program.</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <TuteesTable tutees={visibleTutees} counts={counts} slotsByTutee={slotsByTutee} dismissed={false} />
      </div>

      <DismissedPanel count={dismissedTutees.length}>
        <div className="overflow-x-auto">
          <TuteesTable tutees={dismissedTutees} counts={counts} slotsByTutee={slotsByTutee} dismissed />
        </div>
      </DismissedPanel>
    </div>
  );
}
