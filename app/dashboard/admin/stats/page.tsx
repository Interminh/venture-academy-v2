import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-body">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-ink">{value}</p>
    </Card>
  );
}

export default async function AdminStatsPage() {
  const supabase = await createClient();

  const [
    { count: tutorCount },
    { count: tuteeCount },
    { count: pendingCount },
    { count: approvedCount },
    { data: hoursLog },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "tutor"),
    supabase.from("tutees").select("*", { count: "exact", head: true }),
    supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("tutor_hours")
      .select("tutor_id, hours, profiles(display_name)")
      .order("session_date", { ascending: false }),
  ]);

  const totalHours = (hoursLog ?? []).reduce((sum, h) => sum + h.hours, 0);

  const hoursByTutor = new Map<string, { name: string; hours: number }>();
  for (const h of hoursLog ?? []) {
    const tutor = h.profiles as unknown as { display_name: string } | null;
    const existing = hoursByTutor.get(h.tutor_id);
    if (existing) {
      existing.hours += h.hours;
    } else {
      hoursByTutor.set(h.tutor_id, { name: tutor?.display_name ?? "Tutor", hours: h.hours });
    }
  }
  const tutorRows = Array.from(hoursByTutor.values()).sort((a, b) => b.hours - a.hours);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Stats</h1>
        <p className="mb-6 text-body">A snapshot of the program.</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total hours tutored" value={totalHours} />
          <StatTile label="Students" value={tuteeCount ?? 0} />
          <StatTile label="Tutors" value={tutorCount ?? 0} />
          <StatTile label="Booked sessions" value={approvedCount ?? 0} />
        </div>
        {(pendingCount ?? 0) > 0 && (
          <p className="mt-3 text-sm text-body">
            {pendingCount} claim{pendingCount === 1 ? "" : "s"} still waiting on approval.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Hours by tutor</h2>
        {tutorRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-body">
            No hours logged yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-soft text-xs uppercase tracking-wide text-body">
                  <th className="p-3">Tutor</th>
                  <th className="p-3">Hours</th>
                </tr>
              </thead>
              <tbody>
                {tutorRows.map((t) => (
                  <tr key={t.name} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-ink">{t.name}</td>
                    <td className="p-3">{t.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
