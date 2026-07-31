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

  const [{ data: claims }, { data: contacts }] = await Promise.all([
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

  return (
    <div>
      <RealtimeRefresh table="claims" />
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">My claims</h1>
      <p className="mb-6 text-body">
        Once a director approves a claim, the family&apos;s email shows up
        here so you can reach out directly.
      </p>
      <SlotAgenda items={items} emptyMessage="You haven't claimed any slots yet." />
    </div>
  );
}
