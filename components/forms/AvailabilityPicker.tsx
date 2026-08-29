"use client";

import { WEEKDAYS, WEEKDAY_LABELS, START_TIMES, formatTimeRange } from "@/lib/utils/slots";
import { cn } from "@/lib/utils/cn";
import type { Weekday } from "@/lib/types/database";

export type SlotKey = `${Weekday}|${string}`;
export type SlotLiveStatus = "pending" | "booked";

const CHECKED_STYLES: Record<"open" | SlotLiveStatus, string> = {
  open: "border-status-open bg-status-open",
  pending: "border-status-pending bg-status-pending",
  booked: "border-status-booked bg-status-booked",
};

// A student's single weekly availability grid: Mon-Fri x half-hour start
// times. Each checked cell becomes a `slot` form field valued "day|time".
// Availability isn't tied to a subject. A tutor picks the subject when
// they claim a specific time.
//
// A checked cell's color reflects whatever a tutor has actually done with
// it, plain green means nobody's claimed it, yellow means a claim is
// pending, blue means it's booked, so a parent editing this grid can see
// at a glance which times are live before touching them (unchecking one
// auto-cancels whatever claim is on it).
export function AvailabilityPicker({
  selected,
  onToggle,
  liveStatuses,
}: {
  selected: Set<SlotKey>;
  onToggle: (key: SlotKey) => void;
  liveStatuses?: Partial<Record<SlotKey, SlotLiveStatus>>;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">Weekly availability</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border-b border-border bg-bg-soft p-2" />
              {WEEKDAYS.map((day) => (
                <th key={day} className="border-b border-border bg-bg-soft p-2 font-medium text-body">
                  {WEEKDAY_LABELS[day].slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {START_TIMES.map((time) => (
              <tr key={time}>
                <th className="whitespace-nowrap border-b border-border p-2 text-right font-normal text-body">
                  {formatTimeRange(time)}
                </th>
                {WEEKDAYS.map((day) => {
                  const key: SlotKey = `${day}|${time}`;
                  const isChecked = selected.has(key);
                  const status = liveStatuses?.[key];
                  return (
                    <td key={day} className="border-b border-border p-1 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(key)}
                        aria-pressed={isChecked}
                        aria-label={`${WEEKDAY_LABELS[day]} ${formatTimeRange(time)}${status ? ` (${status})` : ""}`}
                        className={cn(
                          "h-7 w-7 cursor-pointer rounded-md border-2 transition-colors duration-150",
                          isChecked
                            ? CHECKED_STYLES[status ?? "open"]
                            : "border-status-open/30 bg-transparent hover:border-status-open/60"
                        )}
                      >
                        {isChecked && <input type="hidden" name="slot" value={key} />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-body">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border-2 border-status-open bg-status-open" /> Open, unclaimed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border-2 border-status-pending bg-status-pending" /> Pending claim
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border-2 border-status-booked bg-status-booked" /> Booked
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Unchecking a yellow or blue time cancels that tutor&apos;s claim on
        it, pending or already booked, as soon as you save.
      </p>
    </div>
  );
}
