import { createClient } from "@/lib/supabase/server";
import { SlotAgenda, type AgendaItem } from "@/components/slots/SlotAgenda";
import { CancelButton } from "@/components/slots/CancelButton";
import { RealtimeRefresh } from "@/components/slots/RealtimeRefresh";
import { gradeLabel, claimToDisplayStatus } from "@/lib/utils/slots";

export default async function MyClaimsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: claims } = await supabase
    .from("claims")
    .select(
      "id, status, requested_at, availability_slots(id, day, start_time, subjects(name), tutees(first_name, grade))"
    )
    .eq("tutor_id", user!.id)
    .order("requested_at", { ascending: false });

  const items: AgendaItem[] = (claims ?? []).map((c) => {
    const slot = c.availability_slots as unknown as {
      id: string;
      day: AgendaItem["day"];
      start_time: string;
      subjects: { name: string } | null;
      tutees: { first_name: string; grade: number } | null;
    } | null;

    const status = claimToDisplayStatus(c.status);

    return {
      id: c.id,
      day: slot?.day ?? "mon",
      startTime: slot?.start_time ?? "16:00",
      subjectName: slot?.subjects?.name ?? "Subject",
      tuteeLabel: slot?.tutees
        ? `${slot.tutees.first_name} · ${gradeLabel(slot.tutees.grade)}`
        : undefined,
      status,
      actions: status === "booked" ? <CancelButton claimId={c.id} /> : undefined,
    };
  });

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <h1 className="mb-6 font-heading text-2xl font-bold text-ink">My claims</h1>
      <SlotAgenda items={items} emptyMessage="You haven't claimed any slots yet." />
    </div>
  );
}
