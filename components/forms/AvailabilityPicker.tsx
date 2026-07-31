"use client";

import { WEEKDAYS, WEEKDAY_LABELS, START_TIMES, formatTimeRange } from "@/lib/utils/slots";
import { cn } from "@/lib/utils/cn";
import type { Weekday } from "@/lib/types/database";

export type SlotKey = `${Weekday}|${string}`;

// A student's single weekly availability grid: Mon-Fri x half-hour start
// times. Each checked cell becomes a `slot` form field valued "day|time".
// Availability isn't tied to a subject. A tutor picks the subject when
// they claim a specific time.
export function AvailabilityPicker({
  selected,
  onToggle,
}: {
  selected: Set<SlotKey>;
  onToggle: (key: SlotKey) => void;
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
                  return (
                    <td key={day} className="border-b border-border p-1 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(key)}
                        aria-pressed={isChecked}
                        aria-label={`${WEEKDAY_LABELS[day]} ${formatTimeRange(time)}`}
                        className={cn(
                          "h-7 w-7 cursor-pointer rounded-md border transition-colors duration-150",
                          isChecked
                            ? "border-primary bg-primary"
                            : "border-border bg-white hover:border-primary/50"
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
    </div>
  );
}
