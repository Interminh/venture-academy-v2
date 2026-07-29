import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/utils/slots";
import type { Weekday } from "@/lib/types/database";
import { SlotRow } from "./SlotRow";
import type { SlotStatus } from "./StatusTrack";

export interface AgendaItem {
  id: string;
  day: Weekday;
  startTime: string;
  subjectName: string;
  tuteeLabel?: string;
  status: SlotStatus;
  actions?: React.ReactNode;
}

// Groups slot rows by day — the agenda/card-list replacement for the old
// static 8-row-by-5-day grid, easier to scan and to filter on mobile.
export function SlotAgenda({
  items,
  emptyMessage = "Nothing to show here.",
}: {
  items: AgendaItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-body">{emptyMessage}</p>;
  }

  const byDay = new Map<Weekday, AgendaItem[]>();
  for (const day of WEEKDAYS) byDay.set(day, []);
  for (const item of items) byDay.get(item.day)?.push(item);

  return (
    <div className="flex flex-col gap-8">
      {WEEKDAYS.filter((day) => (byDay.get(day)?.length ?? 0) > 0).map((day) => (
        <div key={day}>
          <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-body">
            {WEEKDAY_LABELS[day]}
          </h3>
          <div className="flex flex-col gap-2">
            {byDay
              .get(day)!
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((item) => (
                <SlotRow
                  key={item.id}
                  startTime={item.startTime}
                  subjectName={item.subjectName}
                  tuteeLabel={item.tuteeLabel}
                  status={item.status}
                  actions={item.actions}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
