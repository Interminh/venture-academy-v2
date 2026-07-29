import { createClient } from "@/lib/supabase/server";
import { SlotAgenda, type AgendaItem } from "@/components/slots/SlotAgenda";
import { ClaimButton } from "@/components/slots/ClaimButton";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { Select } from "@/components/ui/Input";
import { gradeLabel, toDisplayStatus } from "@/lib/utils/slots";
import type { SlotStatusValue } from "@/lib/types/database";

export default async function TutorBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; grade?: string }>;
}) {
  const { subject: subjectFilter, grade: gradeFilter } = await searchParams;
  const supabase = await createClient();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  let slotsQuery = supabase
    .from("availability_slots")
    .select("id, day, start_time, subject_id, subjects(name), tutees(first_name, grade)");

  if (subjectFilter) slotsQuery = slotsQuery.eq("subject_id", subjectFilter);

  const { data: slots } = await slotsQuery;

  const filteredSlots = (slots ?? []).filter((s) => {
    if (!gradeFilter) return true;
    const tutee = s.tutees as unknown as { grade: number } | null;
    return tutee?.grade === Number(gradeFilter);
  });

  const slotIds = filteredSlots.map((s) => s.id);
  const { data: statuses } = slotIds.length
    ? await supabase.from("slot_status").select("slot_id, status").in("slot_id", slotIds)
    : { data: [] as { slot_id: string; status: SlotStatusValue }[] };

  const statusBySlot = new Map(
    (statuses ?? []).map((s) => [s.slot_id, s.status as SlotStatusValue])
  );

  const items: AgendaItem[] = filteredSlots.map((s) => {
    const subjectName = (s.subjects as unknown as { name: string } | null)?.name ?? "Subject";
    const tutee = s.tutees as unknown as { first_name: string; grade: number } | null;
    const rawStatus = statusBySlot.get(s.id) ?? "open";
    const status = toDisplayStatus(rawStatus);

    return {
      id: s.id,
      day: s.day,
      startTime: s.start_time,
      subjectName,
      tuteeLabel: tutee ? `${tutee.first_name} · ${gradeLabel(tutee.grade)}` : undefined,
      status,
      actions: status === "open" ? <ClaimButton slotId={s.id} /> : undefined,
    };
  });

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Browse open slots</h1>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <Select name="subject" defaultValue={subjectFilter ?? ""} className="w-auto">
          <option value="">All subjects</option>
          {(subjects ?? []).map((s) => (
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

      <SlotAgenda items={items} emptyMessage="No slots match these filters yet." />
    </div>
  );
}
